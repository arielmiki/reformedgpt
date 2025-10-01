import os
import uuid
import tempfile
from urllib.parse import urlparse
import requests
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings

# Configuration: map of resource name -> URL
# Example provided: {"insitutes": "https://ratrekt.s3.ap-southeast-1.amazonaws.com/institutes.pdf"}
RESOURCES = {
    "insitutes": "https://d3n8njeerjej5l.cloudfront.net//institutes.pdf",
}
DATA_DIR = "./data"

def download_pdfs(resources: dict[str, str]):
    """Download PDFs from URLs into temporary files.

    Returns a list of dicts: { 'name': <resource_name>, 'path': <temp_pdf_path> }
    """
    os.makedirs(DATA_DIR, exist_ok=True)
    entries = []
    for name, url in resources.items():
        try:
            # Determine target file path inside cache dir
            parsed = urlparse(url)
            basename = os.path.basename(parsed.path) if parsed.path else ""
            if not basename or not basename.lower().endswith(".pdf"):
                basename = f"{name}.pdf"
            target_path = os.path.join(DATA_DIR, basename)

            if not os.path.exists(target_path):
                resp = requests.get(url, stream=True, timeout=60)
                resp.raise_for_status()
                with open(target_path, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
            else:
                print(f"Using cached file for '{name}' at {target_path}")

            entries.append({"name": name, "path": target_path, "url": url})
        except Exception as e:
            print(f"  Error downloading '{name}' from {url}: {e}")
    return entries

def get_pdf_files(directory):
    """Deprecated: kept for backward compatibility if needed."""
    return [os.path.join(directory, f) for f in os.listdir(directory) if f.endswith(".pdf")]


def main():
    """Main function to ingest PDF data into Qdrant."""
    pdf_entries = download_pdfs(RESOURCES)
    if not pdf_entries:
        print("No PDF resources available to ingest.")
        return

    print("Initializing clients...")
    model = SentenceTransformer(settings.embedding_model)
    qdrant_client = QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port, timeout=settings.qdrant_timeout)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        separators=["\n\n", "\n", " ", ""],
    )

    all_chunks = []
    for entry in pdf_entries:
        pdf_path = entry["path"]
        source_name = entry["name"]
        source_url = entry.get("url")
        print(f"Processing {source_name} from {pdf_path}...")
        try:
            reader = PdfReader(pdf_path)
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    for chunk in splitter.split_text(text):
                        if len(chunk.strip()) <= 0:
                            continue
                        all_chunks.append({
                            "content": chunk.strip(),
                            "metadata": {
                                "source": source_name,
                                "url": source_url,
                                "page": page_num + 1,
                            }
                        })
        except Exception as e:
            print(f"  Error reading {source_name}: {e}")

    if not all_chunks:
        print("No text chunks found to ingest.")
        return

    print(f"Found {len(all_chunks)} total chunks from {len(pdf_entries)} PDF(s).")

    print("Creating Qdrant collection...")
    qdrant_client.recreate_collection(
        collection_name=settings.qdrant_collection_name,
        vectors_config=models.VectorParams(size=model.get_sentence_embedding_dimension(), distance=models.Distance.COSINE),
    )

    print("Generating embeddings...")
    vectors = model.encode([chunk['content'] for chunk in all_chunks], show_progress_bar=True)

    print("Upserting points to Qdrant in batches...")
    total = len(all_chunks)
    for start in range(0, total, settings.qdrant_batch_size):
        end = min(start + settings.qdrant_batch_size, total)
        batch_chunks = all_chunks[start:end]
        batch_vectors = vectors[start:end]
        points = [
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector.tolist(),
                payload=chunk,
            )
            for chunk, vector in zip(batch_chunks, batch_vectors)
        ]
        qdrant_client.upsert(
            collection_name=settings.qdrant_collection_name,
            points=points,
            wait=True,
        )
        print(f"  Upserted {end} / {total} points")

    print("\nIngestion complete!")
    print(f"{len(all_chunks)} points have been successfully added to the '{settings.qdrant_collection_name}' collection.")

if __name__ == "__main__":
    main()
