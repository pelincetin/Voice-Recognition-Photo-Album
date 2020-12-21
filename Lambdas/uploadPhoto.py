import json
import boto3
import random
import base64
alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
#this function is triggered by the file upload and takes the image and puts it into s3 b1-photos
def lambda_handler(event, context):
    img_data = event['img']
    img_data = img_data[img_data.find(',') + 1:]

    img_data = base64.b64decode(img_data)
    s3 = boto3.client('s3')
    imageName = random.choices(alphabet, k = 10)
    imageName = ''.join(imageName) + ".jpg"
    print(imageName)
    s3.put_object(Bucket="b2-photos1", Key = imageName, Body=img_data)
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }