import json
import boto3
from elasticsearch import Elasticsearch, RequestsHttpConnection
from aws_requests_auth.aws_auth import AWSRequestsAuth
#{
#  "q": "show me pictures of trees"
#}
#This function takes in a text query, parses it with Lex to find keywords and returns, using elasticsearch, the photos
def lambda_handler(event, context):
    # given the search query, disamgibuate the query using the amazon lex bot
    print(event)
    query = event['queryStringParameters']['q']
    print(query)
    print(context)
    client = boto3.client('lex-runtime')
    response = client.post_text(
        botName='searchPics',
        botAlias='$LATEST',
        userId='LF2',
        inputText=query
    )
    # get the labels from lex, we'll call it slot_labels for now
    slot_labels = [response['slots']['keyword'],response['slots']['keywordTwo']]
    print(slot_labels)
    
    # search photos ES index for keywords
    host = 'search-photos-haxqhvg75svk2cvn5vtteztlmi.us-east-1.es.amazonaws.com'
    region = 'us-east-1'
    service = 'es'
    credentials = boto3.Session().get_credentials()
    auth = AWSRequestsAuth(credentials.access_key, credentials.secret_key, host, region, service, aws_token=credentials.token)
    es = Elasticsearch(
        hosts=[{'host':host,'port':443}], 
        use_ssl = True, 
        verify_certs = True, 
        connection_class = RequestsHttpConnection, 
        http_auth = auth
    )
    
    #print(es.search(index="photos", body={"query": {"match": {"labels": 'Tree'}}}))
    
    slot_labels=['Tree', 'Summer'] #TO CHANGE
    result = []
    for label in slot_labels:
        if label != '':
            picture = es.search(index="photos", body={"query": {"match": {"labels": label}}})
            result.append(picture)
    print(result)
    
    output = []
    for r in result:
        if 'hits' in r:
             for val in r['hits']['hits']:
                key = val['_source']['objectKey']
                if key not in output:
                    output.append('https://b2-photos1.s3.amazonaws.com/'+ key)
    
    if not output:
        return{
            'statusCode':200,
            "headers": {"Access-Control-Allow-Origin":"*",
                        "Access-Control-Allow-Credentials":True,
                        "Content-Type":"application/json"},
            'body':'No Results'
        }
    else:    
        return{
            'statusCode': 200,
            'headers': {"Access-Control-Allow-Origin":"*",
                        "Access-Control-Allow-Credentials":True,
                        "Content-Type":"application/json"},
            'body': output,
            'isBase64Encoded': False
        }