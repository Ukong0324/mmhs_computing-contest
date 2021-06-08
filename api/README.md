

# 2021 창의컴퓨팅대회 [![CodeFactor](https://www.codefactor.io/repository/github/ukong0324/mmhs_computing-contest/badge/main?s=b81aee30e8f0e4732773fd18b7f76a5e4ae500b4)](https://www.codefactor.io/repository/github/ukong0324/mmhs_computing-contest/overview/main)
> COVID-19가 끝나는 그날까지.

## API 소개

**현 API는 코로나19 관련 정보들을 제공해드리고 있습니다.**

* NO API KEY
* [질병관리청](http://www.kdca.go.kr/)의 데이터들을 제공함

## 1. 국내 코로나 현황

+ 제공하는 데이터는 아래와 같습니다.   
    + 총 확진자 수, 일일 확진자 수, 격리 해제, 치료 중(격리된 환자들), 사망자 수, 누적 검사 수, 누적 검사 완료 수, 누적 확진율   

* 데이터 정보 출처: [MOHW](http://ncov.mohw.go.kr/)   
* 제공하는 데이터들은 오전 9시 50분에 자동 업데이트 됩니다.   
* 데이터의 기준은 당일 기준 0시 (오전 12시) 입니다.

### 1. 요청 방법 (GET) 
* https://corona-api.xyz/api/korea


### 2. 응답 내용 (Output)

항목명(영어)  | 비고 | 데이터 (예시)
------- |  ------- | --------
total  | 총 확진자 수 | 140,340
today  | 오늘 기준 확진자 수 | 430
domestic  | 오늘 기준 확진자 중 국내 | 411
foreign  | 오늘 기준 확진자 중 해외 유입 | 19
recover  | 누적된 완치 환자 수 | 130,823
care |  현재 치료 중인 환자 수 | 7,558
todayCare | 오늘 기준 치료가 시작된 환자 수 | -14
death | 누적된 사망자 수 | 1,959
todayDeath | 오늘 기준 코로나로 인하여 사망한 환자 수 | 2
totalCheck | 코로나 테스트한 횟수 | 9,761,158
totalChecked | 코로나 테스트가 완료된 수 | 9,633,205
percent | 결과 양성 / 총 검사 완료 수 * 100% | 1.5
updated | 해당 데이터 업데이트 날짜 | 2021.05.31 AM 09.50.00  
  
> 제공하는 데이터의 방식을 확인하고 싶으시다면 [COVID19-korea](https://github.com/Ukong0324/mmhs_computing-contest/blob/main/api/example/data/example-korea.json) 데이터를 확인하여 제공 방식을 참고하십시오.

## 2. 코로나19 연령별 확진 현황  

+ 제공하는 데이터는 아래와 같습니다.   
    +  0~80대 이상, 연령별 확진자, 사망자, 치명률

* 데이터 정보 출처: [MOHW](http://ncov.mohw.go.kr/)   
* 제공하는 데이터들은 오전 9시 50분에 자동 업데이트 됩니다.   
* 데이터의 기준은 당일 기준 0시 (오전 12시) 입니다.

### 1. 요청 방법 (GET)
* https://corona-api.xyz/api/age

### 2. 응답 내용 (Output)

- 아래의 예시 응답 내용의 데이터는 10대 입니다.

항목명(영어) | 비고 | 데이터 (예시)
------- | ------- | --------
total | 해당 연령대 확진자 수 | 10,388
dead | 해당 연령대 사망자 수  | 0
critical | 해당 연령대 치명률 | 0
updated | 해당 데이터 업데이트 날짜 | 2021.05.31 AM 09.50.00

> 제공하는 데이터의 방식을 확인하고 싶으시다면 [COVID19-age](https://github.com/Ukong0324/mmhs_computing-contest/blob/main/api/example/data/example-age.json) 데이터를 확인하여 제공 방식을 참고하십시오.


## 3. 코로나19 성별 코로나 현황  

+ 제공하는 데이터는 아래와 같습니다.   
    +  0~80대 이상, 연령별 사망자 수의 데이터

* 데이터 정보 출처: [MOHW](http://ncov.mohw.go.kr/)   
* 제공하는 데이터들은 오전 9시 50분에 자동 업데이트 됩니다.   
* 데이터의 기준은 당일 기준 0시 (오전 12시) 입니다.

### 1. 요청 방법 (GET)
* https://corona-api.xyz/api/gender

### 2. 응답 내용 (Output)

항목명(영어) | 비고 | 데이터 (예시)
------- | -------- | --------
man > total | 남성 확진자 수  | 70,002
man > dead | 남성 사망자 수 | 970
man > critical | 남성 치명률  | 1.39
women > total | 여성 확진자 수  | 69,908 
women > dead | 여성 사망자 수 | 987
women > critical | 여성 치명률  | 1.41
updated | 업데이트 날짜  | 2021.05.31 AM 09.50.00

> 제공하는 데이터의 방식을 확인하고 싶으시다면 [COVID19-gender](https://github.com/Ukong0324/mmhs_computing-contest/blob/main/api/example/data/example-gender.json) 데이터를 확인하여 제공 방식을 참고하십시오.
## 4. 코로나19 시도별 백신 접종 현황

+ 제공하는 데이터는 아래와 같습니다.   
    +  당일 전국 누적, 실적 데이터

* 데이터 정보 출처: [KDCA](https://ncv.kdca.go.kr/)   
* 제공하는 데이터들은 오전 9시 50분에 자동 업데이트 됩니다.   
* 데이터의 기준은 당일 기준 0시 (오전 12시) 입니다.


### 1. 요청 방법 (GET)
* https://corona-api.xyz/api/vaccine

### 2. 응답 내용 (Output)

- 아래의 예시 응답 내용의 데이터는 서울 입니다.

항목명(영어) | 비고 | 데이터 (예시)
------- | -------- | --------
first_today_result | 1회차 접종 당일 실적 | 75,387
first_today_total | 1회차 접종 당일 누계 | 988,327
second_today_result | 2회차 접종 당일 실적 | 8,127
second_today_total | 2회차 접종 당일 누계 | 333,469
updated | 업데이트 날짜 | 2021.05.31 AM 09.50.00

> [COVID19-vaccine](https://github.com/Ukong0324/mmhs_computing-contest/blob/main/api/example/data/example-vaccine.json) 데이터를 확인하여 제공 방식을 참고하십시오.

## 5. 코로나19 시도별 사회적 거리두기

+ 제공하는 데이터는 아래와 같습니다.   
    + 시도별 사회적 거리두기 단계 데이터

* 데이터 정보 출처: [MOHW](http://ncov.mohw.go.kr/)  
* 제공하는 데이터들은 오전 9시 50분에 자동 업데이트 됩니다.   
* 데이터의 기준은 당일 기준 0시 (오전 12시) 입니다.


### 1. 요청 방법 (GET)
* https://corona-api.xyz/api/social_distancing

### 2. 응답 내용 (Output)

항목명(영어) | 비고 | 데이터 (예시)
------- | -------- | --------
seoul | 서울 | 2
busan | 부산 | 1.5
daegu | 대전 | 1.5
incheon | 인천 | 2
gwangju | 광주| 1.5
daejeon | 대전 | 1.5
ulsan | 울산 | 2
sejong | 세종 | 1.5
gyeonggi | 경기 | 2
gangwon | 강원 | 1.5
chungbuk | 충북 | 1.5
chungnam | 충남 | 1.5
jeollabuk | 전북 | 1.5
jeollanam | 전남 | 1
gyeongbuk | 경북 | 1.5
gyeongnam | 경남 | 1.5
jeju | 제주 | 2
updated | 업데이트 날짜 | 2021.05.31 AM 09.50.00


> 제공하는 데이터의 방식을 확인하고 싶으시다면 [COVID19-social_distancing](https://github.com/Ukong0324/mmhs_computing-contest/blob/main/api/example/data/example-social_distancing.json) 데이터를 확인하여 제공 방식을 참고하십시오.   

## 6. 코로나19 시도별 발생동향  

+ 제공하는 데이터는 아래와 같습니다.   
    +  전일대비 (합계, 국내 발생, 해외유입), 확진환자, 격리중, 격리해제, 사망자, [발생률]

* 데이터 정보 출처: [MOHW](http://ncov.mohw.go.kr/)   
* 제공하는 데이터들은 오전 9시 50분에 자동 업데이트 됩니다.   
* 데이터의 기준은 당일 기준 0시 (오전 12시) 입니다.
* [발생률]은 인구 10만 명당 (지역별 인구 출처 : 행정안전부, 주민등록인구현황 (20.1월 기준))


### 1. 요청 방법 (GET)
* https://corona-api.xyz/api/city

### 2. 응답 내용 (Output)

- 아래의 예시 응답 내용의 데이터는 서울 입니다.

항목명(영어) | 비고 | 데이터 (예시)
------- | -------- | --------
today > total | 전일대비 증감 | 139
today > domestic | 전일대비 국내 증감 | 139
today > foreign | 전일대비 해외유입 증감 | 0
total | 총합 확진환자 | 45,497
care | 격리 중 | 7,704
recover | 격리 해제 | 135,142
death | 사망자 | 1,945
incidence | 발생률 | 467.43
updated | 업데이트 날짜 | 2021.06.08 AM 09.50.00

> [COVID19-city](https://github.com/Ukong0324/mmhs_computing-contest/blob/main/api/example/data/example-city.json) 데이터를 확인하여 제공 방식을 참고하십시오.