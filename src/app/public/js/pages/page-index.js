/* eslint-disable */

document.addEventListener('DOMContentLoaded', async () => {
    // const uuid = 

    console.log(apiService);
    const res = await apiService.axios.post("http://localhost:3000/api/v1/payment/prepare", {
        amount: 300,
    })

    console.log(res);
    const merchant_uid = res.data.data.merchantUid;
    const amount = res.data.data.amount;
    console.log(merchant_uid);


    document.getElementById("portoneId").textContent = merchant_uid + " : " + amount;
    function requestPay(data) {
        IMP.init('imp43457415'); // 예: imp00000000
        //IMP.request_pay(param, callback) 결제창 호출
        IMP.request_pay(
            {
                // param
                pg: 'tosspayments.iamporttest_3',
                pay_method: 'trans', //결제방법 설정에 따라 다르며 공식문서 참고
                merchant_uid: merchant_uid, //상점에서 관리하는 고유 주문번호
                name: "HOTEL ROOM", //주문명
                amount: amount, //결제금액
                buyer_email: 'Iamport@chai.finance',
                buyer_name: '포트원 기술지원팀',
                buyer_tel: '010-1234-5678',
            },
            function (rsp) {
                if (rsp.error_code != null) {
                    // 토스 페이먼츠 결제 성공
                    // {
                    //     "merchant_uid": "fa19fa8c-c3ea-40cc-9756-4de39faf8034",
                    //     "error_code": "F400",
                    //     "error_msg": "결제 창 호출에 실패하였습니다. 이미 승인 완료 되거나 승인 요청 된 거래 건(fa19fa8c-c3ea-40cc-9756-4de39faf8034)입니다."
                    // }
                    apiService.axios.post("http://localhost:3000/api/v1/payment/cancel", {
                        merchant_uid: merchant_uid,
                        ...rsp
                    })
                } else {
                    // 토스 페이먼츠 결제 성공
                    // {
                    //     "imp_uid": "imp_839346456235",
                    //     "merchant_uid": "fa19fa8c-c3ea-40cc-9756-4de39faf8034"
                    // }
                    console.log("결제 성공");
                    console.log(rsp);
                    // apiService.axios.post("http://localhost:3000/api/v1/payment/complete", {
                    //     merchant_uid: merchant_uid,
                    //     ...rsp
                    // })
                }
            },
        );
    }

    document.getElementById("iamportPayment").addEventListener("click", function () {
        requestPay();
    });

});
