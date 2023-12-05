from datetime import datetime
import threading
import time
import schedule

class Scheduler:
    def __init__(self, ec2_client):
        self.instance_cache = []
        self.ec2_client = ec2_client

        schedule.every(1).hours.at(":00").do(self.run_shutdown)
 
        scheduler_thread = threading.Thread(target=self.run_scheduler)
        scheduler_thread.start()

    # Start the scheduler in a separate thread
    def run_scheduler(self):
        while True:
            schedule.run_pending()
            time.sleep(1)
    
    def run_shutdown(self):
        print("Running auto-shutdown checks...")
        current_hour_utc = datetime.utcnow().hour
        self.instance_cache = self.ec2_client.list_instances()

        for item in self.instance_cache:
            sdt = int(item["shutdownTime"]) if item["shutdownTime"].isdigit() else -1
            if (sdt == current_hour_utc and item["state"] == "running"):
                print(" - Scheduled Shutdown of: " + item["displayName"])
                self.ec2_client.stop_instance(item["instanceId"])
