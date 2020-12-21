import json
import boto3
from elasticsearch import Elasticsearch, RequestsHttpConnection
from aws_requests_auth.aws_auth import AWSRequestsAuth

#this method goes off whenever a photo is uploaded to S3, it loads it into elastic searc
def lambda_handler(event, context):
    # You pass the input image as base64-encoded image bytes or as a reference 
    # to an image in an Amazon S3 bucket.
    client = boto3.client('rekognition')
    print(event)
    
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    image_key = event['Records'][0]['s3']['object']['key']
    time_stamp =  event['Records'][0]['eventTime']
    
    #detect labels with rekognition
    image_data = client.detect_labels(Image={'S3Object': {'Bucket': bucket_name, 'Name': image_key}}, MaxLabels=10)
    
    labels=[]
    for label in image_data["Labels"]: 
      labels.append(label["Name"])
    
    print(labels)
    json_object = {
      "objectKey": image_key,
      "bucket": bucket_name,
      "createdTimestamp": time_stamp,
      "labels": labels
    }
    
    host = 'search-photos-haxqhvg75svk2cvn5vtteztlmi.us-east-1.es.amazonaws.com'
    region = 'us-east-1'
    service = 'es'
    credentials = boto3.Session().get_credentials()
    auth = AWSRequestsAuth(credentials.access_key, credentials.secret_key, host, region, service, aws_token=credentials.token)
    es = Elasticsearch(hosts=[{'host':host,'port':443}], 
                      use_ssl = True, 
                      verify_certs = True, 
                      connection_class = RequestsHttpConnection, 
                      http_auth = auth)
    
    es.index(index="photos", id=image_key, body=json_object) #adds JSON object to elasticsearch index
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }