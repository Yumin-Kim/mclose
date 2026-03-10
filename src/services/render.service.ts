import { Injectable } from '@nestjs/common';
import { handlebars } from 'hbs';

@Injectable()
export class RenderService {
  constructor() {}

  // json 형태로 보여줄 데이터
  jsonStringifyHelper() {
    handlebars.registerHelper('jsonStringify', function (context) {
      return JSON.stringify(context);
    });
  }

  // "==" 비교 함수
  equalHelper() {
    handlebars.registerHelper('ifCond', function (v1, v2, options) {
      if (v1 === v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
  }

  // "!=" 비교 함수
  notEqualHelper() {
    handlebars.registerHelper('ifNotCond', function (v1, v2, options) {
      if (v1 !== v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
  }

  // array length 비교 함수
  arrayLengthHelper() {
    handlebars.registerHelper('ifArrayLengthCond', function (v1, v2, options) {
      if (v1.length - 1 == v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    });
  }

  // 계산 함수
  equalCalcNumberHelper() {
    handlebars.registerHelper(
      'equalCalcNumber',
      function (v1, v2, v3, v4, options) {
        // v1 = number, v2 = number, v3 = + - * / % , v4 = number(result)
        switch (v3) {
          case '+':
            if (v1 + v2 == v4) {
              return options.fn(this);
            }
            return options.inverse(this);
          case '-':
            if (v1 - v2 == v4) {
              return options.fn(this);
            }
            return options.inverse(this);
          case '*':
            if (v1 * v2 == v4) {
              return options.fn(this);
            }
            return options.inverse(this);
          case '/':
            if (v1 / v2 == v4) {
              return options.fn(this);
            }
            return options.inverse(this);
          case '%':
            if (v1 % v2 == v4) {
              return options.fn(this);
            }
            return options.inverse(this);
          default:
            return options.inverse(this);
        }
      },
    );
  }

  // 비교 함수
  compareHelper() {
    handlebars.registerHelper(
      'when',
      function (operand_1, operator, operand_2, options) {
        const operators = {
            eq: function (l, r) {
              return l == r;
            },
            noteq: function (l, r) {
              return l != r;
            },
            gt: function (l, r) {
              return Number(l) > Number(r);
            },
            or: function (l, r) {
              return l || r;
            },
            and: function (l, r) {
              return l && r;
            },
            '%': function (l, r) {
              return l % r === 0;
            },
          },
          result = operators[operator](operand_1, operand_2);

        if (result) return options.fn(this);
        else return options.inverse(this);
      },
    );
  }

  // toggle Dom attribute
  toggleDomAttributeHelper() {
    handlebars.registerHelper('ifToggleAttrName', function (cond, v1, v2) {
      return cond ? v1 : v2;
    });
  }

  convertNewlinesToBarMaxLine() {
    handlebars.registerHelper('convertNewlinesToBarMaxLine', function (v1, v2) {
      if (!v1) return v1;

      if (Number(v2) == 0) return v1.replace(/\n/g, '<br>');
      else {
        const paragraphLength = v1
          .split('\n')
          .filter((item) => item.trim() != '');
        if (paragraphLength.length > Number(v2)) {
          return v1.split('\n').slice(0, Number(v2)).join('<br>') + '...';
        } else return v1.replace(/\n/g, '<br>');
      }
      // return v1.split('\n').slice(0, Number(v2)).join('<br>') + '...';
    });
  }

  // youtube url에서 videoId 추출
  extractYoutubeVideoIdHelper() {
    handlebars.registerHelper('extractYoutubeVideoId', function (url) {
      const regex =
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(regex);

      // 동영상 ID 반환
      return match ? match[1] : null;
    });
  }

  extractYoutubeVideoTimeHelper() {
    handlebars.registerHelper('extractYoutubeVideoTime', function (url) {
      const regex = /(?:\?|&)t=([0-9hms]+)/;
      const match = url.match(regex);

      // 동영상 ID 반환
      return match ? match[1] : 0;
    });
  }

  // convert score annotation measure to text
  convertScoreAnnotationMeasureToTextHelper() {
    handlebars.registerHelper(
      'convertScoreAnnotationMeasureToText',
      function (v1) {
        if (!v1 || v1.trim() == '') return '';
        if (!JSON.parse(v1).measurePositionList) {
          return '';
        }

        const measureIdList = JSON.parse(v1).measurePositionList.map(
          (item) => item.measureId,
        );
        if (measureIdList.length == 1) return measureIdList[0].toString();

        const startId = measureIdList.shift();
        const endId = measureIdList.pop();
        return `${startId} - ${endId}`;
      },
    );
  }

  // convert score id to text
  // [1,2,3,4] -> 1 - 4
  // [1] -> 1
  convertScoreIdToTextHelper() {
    handlebars.registerHelper('convertScoreIdToText', function (v1) {
      if (!v1 || !Array.isArray(v1)) return '';
      if (v1.length == 1) return v1[0].toString();

      const startId = v1[0];
      const endId = v1[v1.length - 1];

      return `${startId} - ${endId}`;
    });
  }

  joinArrayHelper() {
    handlebars.registerHelper('joinArray', function (v1) {
      let checkArr = false;
      v1.forEach((item) => {
        if (Array.isArray(item)) checkArr = true;
      });

      if (checkArr) {
        return v1.flat().join();
      } else {
        return v1.join();
      }
    });
  }
}
