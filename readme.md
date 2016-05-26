# Alfred용 디데이 Workflow

![스크린샷](https://github.com/EBvi/dday/blob/master/screenshot.png?raw=true)

- 연락처에 등록된 생일, 기념일을 검색하여 얼마나 남았는지 보여줍니다
- 한국천문연구원의 음력 데이터를 기반으로 정확한 **음력 날짜**를 보여줍니다
- 최소한의 네트워크만을 사용하기 때문에 매우 빠릅니다 (한번 불러온 음력날짜를 저장해둡니다)

## 요구조건

[JXA](https://developer.apple.com/library/mac/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/Introduction.html)로 작성되었기 때문에 다음과 같은 요구사항이 필요합니다

- OSX 10.11+ (엘 캐피탄 이상)
- Alfred 3+

## 음력 날짜로 지정하는 방법

- [HappyDays](https://itunes.apple.com/kr/app/happydays-saeng-ginyeom-didei/id368501483?mt=8)에서 사용한 음력 기록 방식의 일부를 따릅니다
- 기념일을 "음력:-"과 같이 **:-**를 붙여서 필드명을 저장하면, 음력 날짜로 불러옵니다

```
예)
생신:-
음력:-
```

## 알려진 이슈

- 특정 조건에 의해 연락처의 경로(~/Library/Application\\ Support/AddressBook/Sources/)가 변경된 경우, 제대로 데이터를 불러오지 못할 수 있습니다
- 한국천문연구원의 문서를 분석하여 결과를 제공하기 때문에, 해당 페이지가 변경되면 일부 기능이 작동하지 않을 수 있습니다