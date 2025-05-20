"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressStatus = exports.QuestionType = void 0;
var QuestionType;
(function (QuestionType) {
    QuestionType["MULTIPLE_CHOICE"] = "MULTIPLE_CHOICE";
    QuestionType["FILL_IN_BLANK"] = "FILL_IN_BLANK";
    QuestionType["MATCHING"] = "MATCHING";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var ProgressStatus;
(function (ProgressStatus) {
    ProgressStatus["NOT_STARTED"] = "NOT_STARTED";
    ProgressStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ProgressStatus["COMPLETED"] = "COMPLETED";
})(ProgressStatus || (exports.ProgressStatus = ProgressStatus = {}));
//# sourceMappingURL=quiz.types.js.map