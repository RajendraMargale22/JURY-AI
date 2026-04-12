from fastapi import FastAPI
app = FastAPI()
@app.get("/health")
def root(): return "hello"
