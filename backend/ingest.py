import os
import uuid
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models

# Configuration
DATA_DIR = "./data"
MODEL_NAME = 'all-MiniLM-L6-v2'
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "documents")

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
    qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

    all_chunks = []
    for pdf_path in pdf_files:
        print(f"Processing {pdf_path}...")
        try:
            reader = PdfReader(pdf_path)
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    paragraphs = text.split('\n\n')
                    for para in paragraphs:
                        if len(para.strip()) > 50:  # Filter out short/empty paragraphs
                            content = para.strip()
                            all_chunks.append({
                                "content": content,
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

    print("Upserting points to Qdrant...")
    qdrant_client.upsert(
        collection_name=COLLECTION_NAME,
        points=[
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector.tolist(),
                payload=chunk
            )
            for chunk, vector in zip(all_chunks, vectors)
        ],
        wait=True,
    )

    print("\nIngestion complete!")
    print(f"{len(all_chunks)} points have been successfully added to the '{COLLECTION_NAME}' collection.")

if __name__ == "__main__":
    main()
