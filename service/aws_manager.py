from datetime import datetime
import boto3
import pytz

def dateTimeToString(dt):
   # return f'{dt.year}-0{dt.month}-{dt.day}T{dt.hour}:{dt.minute}:{dt.second}.00Z'
    return dt.isoformat()

class EC2Client:
    def __init__(self):
        self.client = boto3.client('ec2')
        self.amiMetadataCache = self.client.describe_images(Owners=['self'])["Images"]

    def getOperatingSystem(self, imageId):
        
        found_ami = [item for item in self.amiMetadataCache if item["ImageId"] == imageId]
        if (len(found_ami) > 0):
            return found_ami[0]["PlatformDetails"]
        else:
            return "-unknown-"

    def getPreviousCost(self, instance):
        instance_tags = instance.get('Tags', [])
        tag_dict = {item['Key']: item['Value'] for item in instance_tags}        
        prevStr = tag_dict["PreviousCost"] if "PreviousCost" in tag_dict else "0"
        return float(prevStr);

    def calculateRunningCost(self, instance): 
        if (instance['State']['Name'] != 'running'):
            return 0
        
        launchTime = instance['LaunchTime']
        imageId = instance.get('ImageId', '-')
        instanceType = instance['InstanceType']
        time_difference = datetime.now(pytz.utc) - launchTime
        hours_difference = round(time_difference.total_seconds() / 3600, 1)
        os = self.getOperatingSystem(imageId).lower()
        pricemap = [
            { "os": "linux", "instanceType": "t2.micro", "rate": 0.0116 },
            { "os": "linux", "instanceType": "t2.large", "rate": 0.188 },
            { "os": "linux", "instanceType": "t2.xlarge", "rate": 0.376 },
            { "os": "linux", "instanceType": "t2.2xlarge", "rate": 0.752 },
            { "os": "windows", "instanceType": "t2.micro", "rate": 0.019 },
            { "os": "windows", "instanceType": "t2.large", "rate": 0.273 },
            { "os": "windows", "instanceType": "t2.xlarge", "rate": 0.541 },
            { "os": "windows", "instanceType": "t2.2xlarge", "rate": 1.082 },
        ]
        rates = [item for item in pricemap 
                if (item["os"] in os and item["instanceType"] == instanceType)]
        
        if (len(rates) > 0):
            # print(f'{imageId}/{os}: {hours_difference} * {rates[0]["rate"]} = {hours_difference * rates[0]["rate"]}')
            return hours_difference * rates[0]["rate"]
        else:
            # print(f'NOTFOUND - {imageId}: {os}')
            return 0
        


    def list_instances(self):
        # Call AWS EC2 DescribeInstances API to list all instances
        response = self.client.describe_instances(Filters=[{'Name': 'tag-key', 'Values': ['Owner']}])

        instances = []
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                
                instance_tags = instance.get('Tags', [])
                tag_dict = {item['Key']: item['Value'] for item in instance_tags}
                accruedCost = str(round(self.calculateRunningCost(instance) + self.getPreviousCost(instance), 2))
                launchTimeStr = dateTimeToString(instance['LaunchTime']) if instance['State']['Name']=='running' else ''

                instances.append({
                    'instanceId': instance['InstanceId'],
                    'instanceType': instance['InstanceType'],
                    'state': instance['State']['Name'],
                    'tags': instance.get('Tags', []),
                    'publicIpAddress': instance.get('PublicIpAddress', '-'),
                    'publicDnsName': instance.get('PublicDnsName', '-'),
                    'imageId': instance.get('ImageId', '-'),
                    'launchTime': launchTimeStr,
                    'accruedCost': accruedCost,
                    'os': self.getOperatingSystem(instance.get('ImageId', '-')),
                    
                    'owner': tag_dict["Owner"] if "Owner" in tag_dict else "",
                    'displayName': tag_dict["DisplayName"] if "DisplayName" in tag_dict else "",
                    'shutdownTime': tag_dict["ShutdownTime"] if "ShutdownTime" in tag_dict else ""
                })
        return instances
    
    def terminate_instance(self, instance_id):
        response = self.client.terminate_instances(InstanceIds=[instance_id])
        return
    
    def stop_instance(self, instance_id):
        instances = self.client.describe_instances(InstanceIds=[instance_id])
        instance = instances['Reservations'][0]['Instances'][0]

        runningCost = self.calculateRunningCost(instance)
        prevCost = self.getPreviousCost(instance)
        totalCost = str(round(runningCost+prevCost, 2))
        self.client.create_tags(Resources=[instance_id], Tags=[{'Key': 'PreviousCost', 'Value': totalCost}])

        response = self.client.stop_instances(InstanceIds=[instance_id])
        return
    
    def start_instance(self, instance_id):
        response = self.client.start_instances(InstanceIds=[instance_id])
        return  
    
    def terminate_instance(self, instance_id):
        response = self.client.terminate_instances(InstanceIds=[instance_id])
        return    
    
    def create_instance(self, data):
        tags = [{'Key': 'Owner','Value': 'jmarston'},
                {'Key': 'DisplayName','Value': data.name },
                {'Key': 'ShutdownTime','Value': data.shutdownTime },
                {'Key': 'Department','Value': 'Development'}]
        
        instance_params = {
            'ImageId': data.ami,  # Replace with the ID of the desired Amazon Machine Image (AMI)
            'InstanceType': data.instanceType,
            'MinCount': 1,
            'MaxCount': 1,
            'KeyName': 'AWSPersonalTestPortal',  # Replace with the name of your EC2 Key Pair
            'SecurityGroupIds': ['sg-08909d6bba0c94319'], # 'sg-19953e45'],  # Replace with the ID of your desired security group(s)
            'SubnetId': 'subnet-73ff083e',  # Replace with the ID of your desired subnet
            'TagSpecifications': [{
                'ResourceType': 'instance',
                'Tags': tags
            }]
        }

        # Launch the new EC2 instance
        response = self.client.run_instances(**instance_params)

        # Get the instance ID of the launched instance
        instance_id = response['Instances'][0]['InstanceId']

        # Wait for the instance to be in the 'running' state
        # self.client.get_waiter('instance_running').wait(InstanceIds=[instance_id])

        # print(f"EC2 instance with ID {instance_id} is now running.")
        return
    
    def get_metadata(self):
        self.amiMetadataCache = self.client.describe_images(Owners=['self'])["Images"]
        images = list(map(lambda obj: {"imageId": obj["ImageId"], 
                                       "name": obj["Name"],
                                       "os": obj["PlatformDetails"]},
                                       self.amiMetadataCache))

        return images