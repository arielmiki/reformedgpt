import os
import uuid
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Configuration
DATA_DIR = "./data"
MODEL_NAME = 'all-MiniLM-L6-v2'
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "documents")
QDRANT_TIMEOUT = float(os.getenv("QDRANT_TIMEOUT", 60.0))
QDRANT_BATCH_SIZE = int(os.getenv("QDRANT_BATCH_SIZE", 200))

def get_pdf_files(directory):
    """Get all PDF files from a directory."""
    return [os.path.join(directory, f) for f in os.listdir(directory) if f.endswith(".pdf")]


def main():
    """Main function to ingest PDF data into Qdrant."""
    pdf_files = get_pdf_files(DATA_DIR)
    if not pdf_files:
        print(f"No PDF files found in '{DATA_DIR}'.")
        return

    print("Initializing clients...")
    model = SentenceTransformer(MODEL_NAME)
    qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT, timeout=QDRANT_TIMEOUT)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        separators=["\n\n", "\n", " ", ""],
    )

    all_chunks = []
    for pdf_path in pdf_files:
        print(f"Processing {pdf_path}...")
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
                                "source": os.path.basename(pdf_path),
                                "page": page_num + 1,
                            }
                        })
        except Exception as e:
            print(f"  Error reading {pdf_path}: {e}")

    if not all_chunks:
        print("No text chunks found to ingest.")
        return

    print(f"Found {len(all_chunks)} total chunks from {len(pdf_files)} PDF(s).")

    print("Creating Qdrant collection...")
    qdrant_client.recreate_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=models.VectorParams(size=model.get_sentence_embedding_dimension(), distance=models.Distance.COSINE),
    )

    print("Generating embeddings...")
    vectors = model.encode([chunk['content'] for chunk in all_chunks], show_progress_bar=True)

    print("Upserting points to Qdrant in batches...")
    total = len(all_chunks)
    for start in range(0, total, QDRANT_BATCH_SIZE):
        end = min(start + QDRANT_BATCH_SIZE, total)
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
            collection_name=COLLECTION_NAME,
            points=points,
            wait=True,
        )
        print(f"  Upserted {end} / {total} points")

    print("\nIngestion complete!")
    print(f"{len(all_chunks)} points have been successfully added to the '{COLLECTION_NAME}' collection.")

if __name__ == "__main__":
    main()
