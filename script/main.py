# 파이썬을 이용하여 데이터 분석
# https://corona-api.xyz < github repo redirect

import requests
import json

res = requests.get('https://corona-api.xyz/api/korea')
data = json.loads(res.text)

print(f"{data}")

