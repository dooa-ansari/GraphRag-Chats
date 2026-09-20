from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI"}


@app.post("/save-graph")
def save_graph():
    return {"message": "Graph saved successfully", "status": "success"}
