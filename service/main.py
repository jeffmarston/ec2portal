import os
import threading
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from scheduler import Scheduler
from aws_manager import EC2Client
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel



app = FastAPI()
ec2_client = EC2Client()
app_api = FastAPI(title="api")

execute_path = os.path.dirname(os.path.realpath(__file__))
ui_path = os.path.abspath(os.path.join(execute_path, '..', 'frontend', 'build'))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VmRequestClass(BaseModel):
    name: str
    instanceType: str
    ami: str
    shutdownTime: str

class VmActionClass(BaseModel):
    command: str
    instanceId: str

scheduler = Scheduler(ec2_client)


@app_api.get("/machines/")
async def list_ec2_instances():
    instances = ec2_client.list_instances()
    return instances
    
@app_api.post("/machines/")
async def create_instance(request: Request):
    data = await request.json()
    vmRequest_obj = VmRequestClass(**data)
    ec2_client.create_instance(vmRequest_obj)
    return
    
@app_api.post("/machines/action")
async def create_instance(request: Request):
    data = await request.json()
    vmAction_obj = VmActionClass(**data)
    if (vmAction_obj.command == "stop"):
        ec2_client.stop_instance(vmAction_obj.instanceId)
    elif (vmAction_obj.command == "start"):
        ec2_client.start_instance(vmAction_obj.instanceId)
    elif (vmAction_obj.command == "terminate"):
        ec2_client.terminate_instance(vmAction_obj.instanceId)
    return


@app_api.get("/metadata/")
async def get_ec2_metadata():
    metadata = ec2_client.get_metadata()
    return metadata
    
class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = None
        try:
            response = await super().get_response(path, scope)
        except HTTPException as inst:
            response = await super().get_response('.', scope)
            print("Error: "+inst)
        if response.status_code == 404:
            response = await super().get_response('.', scope)
        return response

app.mount("/api", app_api)
app.mount("/", SPAStaticFiles(directory=ui_path, html=True), name="app")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)