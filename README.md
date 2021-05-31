# 2021 창의컴퓨팅대회
> COVID-19가 끝나는 그날까지.

## API 소개

**현 API는 코로나 관련 정보들을 제공해드리고 있습니다.**

* NO API KEY
* 공식적인 데이터들을 제공 [MOHW](http://ncov.mohw.go.kr/)

## 1. 국내 코로나 현황

+ 제공하는 데이터는 아래와 같습니다.   
    + 총 확진자 수, 일일 확진자 수, 격리 해제, 치료 중(격리된 환자들), 사망자 수, 누적 검사 수, 누적 검사 완료 수, 누적 확진율   

* 데이터 정보 출처: [MOHW](http://ncov.mohw.go.kr/)   
* 제공하는 데이터들은 오전 10시에 자동 업데이트 됩니다.

### 1. 요청 방법 (GET) 
* **Nothing**


### 2. 응답 내용 (Output)

항목명(영어) | 항목명(한글) | 비고 | 데이터 (예시)
------- | -------- | ------- | --------
total | 총 확진 환자 | 누적된 확진 환자 수 | 140,340
today | 전일대비 | 오늘 확진된 환자 수 | 430
domestic | 국내 발생 | 오늘 확진된 환자 중 국내 환자 수 | 411
foreign | 해외유입 | 오늘 확진 환자 중 해외 유입된 환자 수 | 19
recover | 총 격리 해제 | 누적된 완치 환자 수 | 130,823
care | 치료 중 | 현재 치료 중인 환자 수 | 7,558
todayCare | 전일대비 치료 수 | 전일대비 치료가 시작된 수 | -14
death | 총 사망자 | 누적된 사망자 수 | 1,959
todayDeath | 사망자 | 코로나로 인하여 사망한 환자 수 | 2
totalCheck | 누적 검사 수 | 총 코로나 테스트한 횟수 | 9,761,158
totalChecked | 누적 검사 완료 수 | 총 코로나 테스트가 완료된 수 | 9,633,205
percent | 누적 확진율 | 결과 양성 / 총 검사 완료 수 * 100% | 1.5
updated | 업데이트 날짜 | 해당 데이터 업데이트 날짜 | 2021.05.31 AM 10.00.00  
  
> 제공하는 데이터의 방식을 확인하고 싶으시다면 [covid19-korea](https://github.com/Ukong0324/mmhs_computing-contest/blob/main/api/example/data/example-korea.json)를 확인하여 제공 방식을 참고하십시요.

## 2. 코로나19 연령별 확진 현황  

+ 제공하는 데이터는 아래와 같습니다.   
    +  0~80대 이상, 연령별 확진자 수의 데이터

* 데이터 정보 출처: [MOHW](http://ncov.mohw.go.kr/)   
* 제공하는 데이터들은 오전 10시에 자동 업데이트 됩니다.

### 1. 요청 방법 (GET)
* **Nothing**

### 2. 응답 내용 (Output)

항목명(영어) | 항목명(한글) | 비고 | 데이터 (예시)
------- | -------- | ------- | --------
zero | 0-9 | 영유아, 어린이 확진자 수 | 6,181
ten | 10-19 | 10대 확진자 수 | 9,973
twenty | 20-29 | 20대 확진자 수 | 20,992
thirty | 30-39 | 30대 확진자 수 | 19,200
forty | 40-49 | 40대 확진자 수 | 21,073
fifty | 50-59 | 50대 확진자 수 | 25,747
sixty | 60-69 | 60대 확진자 수 | 21,238
seventy | 70-79 | 70대 확진자 수 | 9,784
eighty | 80+ | 80대 이상 확진자 수 | 5,722
updated | 업데이트 날짜 | 해당 데이터 업데이트 날짜 | 2021.05.31 AM 10.00.00


<<<<<<< Updated upstream
> 제공하는 데이터의 방식을 확인하고 싶으시다면 [age-data](https://github.com/Ukong0324/corona-api-docs/blob/main/example-patient.json)를 확인하여 제공 방식을 참고하십시요.
=======
> 제공하는 데이터의 방식을 확인하고 싶으시다면 [age-data](https://github.com/Ukong0324/mmhs_computing-contest/blob/main/api/example/data/example-age.json)를 확인하여 제공 방식을 참고하십시요.
>>>>>>> Stashed changes
