import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Acti,
  vityIndicator,
} from "react-native";
import { getQuizzesByChapter } from "../../services/quiz";
import {
  gradeQuizSubmission,
  saveQuizSubmission,
} from "../../services/grading";

export default function StudentQuizScreen({ chapter, onBack }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [fillAnswer, setFillAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState("start"); // start, quiz, result
  const [gradeResult, setGradeResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    const result = await getQuizzesByChapter(chapter.$id);
    if (result.success) {
      setQuizzes(result.data);
    }
    setLoading(false);
  };

  const getOptions = (quiz) => {
    try {
      return JSON.parse(quiz.options);
    } catch {
      return [];
    }
  };

  const handleAnswer = (quizId, answer) => {
    setAnswers((prev) => ({ ...prev, [quizId]: answer }));
  };

  const handleNext = () => {
    const currentQuiz = quizzes[currentIndex];

    // Fill blanks answer save చేయి
    if (currentQuiz.type === "fillblanks" && fillAnswer) {
      handleAnswer(currentQuiz.$id, fillAnswer);
      setFillAnswer("");
    }

    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
  if (timerRef.current) clearInterval(timerRef.current);
  const gradeResult = gradeQuizSubmission(quizzes, answers);
  setScore(gradeResult.score);
  await saveQuizSubmission('student-id', chapter.$id, answers, gradeResult);
  setMode('result');
};

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setFillAnswer("");
    setSubmitted(false);
    setScore(0);
    setMode("start");
  };

  const getScoreColor = () => {
    const percentage = (score / quizzes.length) * 100;
    if (percentage >= 80) return "#388e3c";
    if (percentage >= 50) return "#f57c00";
    return "#e53935";
  };

  const getScoreMessage = () => {
    const percentage = (score / quizzes.length) * 100;
    if (percentage === 100) return "🏆 అద్భుతం! పర్ఫెక్ట్ స్కోర్!";
    if (percentage >= 80) return "🌟 చాలా బాగుంది!";
    if (percentage >= 50) return "👍 బాగుంది, మరింత చదవండి!";
    return "📚 మరింత practice చేయండి!";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← వెనక్కి</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🎯 Quiz</Text>
        </View>
        <ActivityIndicator
          color="#f57c00"
          size="large"
          style={{ marginTop: 50 }}
        />
      </View>
    );
  }

  // START Screen
  if (mode === "start") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← వెనక్కి</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🎯 {chapter.name}</Text>
          <Text style={styles.headerSub}>Self Quiz</Text>
        </View>

        <View style={styles.startContainer}>
          <Text style={styles.startIcon}>🎯</Text>
          <Text style={styles.startTitle}>{chapter.name}</Text>
          <Text style={styles.startSubtitle}>Quiz సిద్ధంగా ఉంది!</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{quizzes.length}</Text>
              <Text style={styles.statLabel}>ప్రశ్నలు</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {quizzes.filter((q) => q.type === "mcq").length}
              </Text>
              <Text style={styles.statLabel}>MCQ</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {quizzes.filter((q) => q.type === "truefalse").length}
              </Text>
              <Text style={styles.statLabel}>T/F</Text>
            </View>
          </View>

          {quizzes.length === 0 ? (
            <Text style={styles.emptyText}>ఇంకా Quiz ప్రశ్నలు లేవు</Text>
          ) : (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => setMode("quiz")}
            >
              <Text style={styles.startBtnText}>Quiz మొదలుపెట్టు →</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.backToBtn} onPress={onBack}>
            <Text style={styles.backToBtnText}>← వెనక్కి వెళ్ళు</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // RESULT Screen
  if (mode === "result") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏆 Quiz Result</Text>
        </View>

        <ScrollView style={styles.resultContainer}>
          <View style={[styles.scoreBox, { borderColor: getScoreColor() }]}>
            <Text style={[styles.scoreNumber, { color: getScoreColor() }]}>
              {score}/{quizzes.length}
            </Text>
            <Text style={styles.scorePercent}>
              {Math.round((score / quizzes.length) * 100)}%
            </Text>
            <Text style={styles.scoreMessage}>{getScoreMessage()}</Text>
          </View>

          {/* Answer Review */}
          <Text style={styles.reviewTitle}>సమాధానాల సమీక్ష:</Text>
          {quizzes.map((quiz, index) => {
            const userAnswer = answers[quiz.$id];
            let isCorrect = false;

            if (quiz.type === "mcq") {
              const options = getOptions(quiz);
              const answerIndex = quiz.answer.charCodeAt(0) - 65;
              isCorrect = userAnswer === options[answerIndex];
            } else {
              isCorrect =
                userAnswer?.toLowerCase().trim() ===
                quiz.answer.toLowerCase().trim();
            }

            return (
              <View
                key={quiz.$id}
                style={[
                  styles.reviewCard,
                  { borderLeftColor: isCorrect ? "#388e3c" : "#e53935" },
                ]}
              >
                <Text style={styles.reviewQ}>
                  Q{index + 1}: {quiz.question}
                </Text>
                <Text
                  style={[
                    styles.reviewAnswer,
                    { color: isCorrect ? "#388e3c" : "#e53935" },
                  ]}
                >
                  నీ సమాధానం: {userAnswer || "సమాధానం ఇవ్వలేదు"}{" "}
                  {isCorrect ? "✅" : "❌"}
                </Text>
                {!isCorrect && (
                  <Text style={styles.correctAnswer}>
                    సరైన సమాధానం: {quiz.answer}
                  </Text>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart}>
            <Text style={styles.restartBtnText}>🔄 మళ్ళీ చేయి</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.exitBtn} onPress={onBack}>
            <Text style={styles.exitBtnText}>← వెనక్కి వెళ్ళు</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // QUIZ Screen
  const currentQuiz = quizzes[currentIndex];
  const options = getOptions(currentQuiz);
  const progress = ((currentIndex + 1) / quizzes.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎯 Quiz</Text>
        <Text style={styles.headerSub}>
          {currentIndex + 1}/{quizzes.length} ప్రశ్నలు
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.quizContent}>
        {/* Question */}
        <View style={styles.questionBox}>
          <Text style={styles.questionNumber}>ప్రశ్న {currentIndex + 1}</Text>
          <Text style={styles.questionText}>{currentQuiz.question}</Text>
          <Text style={styles.questionType}>
            {currentQuiz.type === "mcq"
              ? "🔵 బహుళ ఎంపిక"
              : currentQuiz.type === "truefalse"
                ? "✅ నిజం/అబద్ధం"
                : "✏️ Fill in the Blanks"}
          </Text>
        </View>

        {/* MCQ Options */}
        {currentQuiz.type === "mcq" && (
          <View style={styles.optionsContainer}>
            {options.map((opt, i) => {
              const isSelected = answers[currentQuiz.$id] === opt;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.optionBtn,
                    isSelected && styles.optionBtnSelected,
                  ]}
                  onPress={() => handleAnswer(currentQuiz.$id, opt)}
                >
                  <Text
                    style={[
                      styles.optionLetter,
                      isSelected && styles.optionLetterSelected,
                    ]}
                  >
                    {String.fromCharCode(65 + i)}
                  </Text>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* True/False */}
        {currentQuiz.type === "truefalse" && (
          <View style={styles.tfContainer}>
            {["నిజం", "అబద్ధం"].map((opt) => {
              const isSelected = answers[currentQuiz.$id] === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.tfBtn,
                    isSelected &&
                      (opt === "నిజం" ? styles.tfTrue : styles.tfFalse),
                  ]}
                  onPress={() => handleAnswer(currentQuiz.$id, opt)}
                >
                  <Text style={styles.tfIcon}>
                    {opt === "నిజం" ? "✅" : "❌"}
                  </Text>
                  <Text
                    style={[styles.tfText, isSelected && styles.tfTextSelected]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Fill in Blanks */}
        {currentQuiz.type === "fillblanks" && (
          <View style={styles.fillContainer}>
            <TextInput
              style={styles.fillInput}
              placeholder="సమాధానం రాయండి..."
              placeholderTextColor="#999"
              value={fillAnswer || answers[currentQuiz.$id] || ""}
              onChangeText={(text) => {
                setFillAnswer(text);
                handleAnswer(currentQuiz.$id, text);
              }}
            />
          </View>
        )}

        {/* Next Button */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentIndex === quizzes.length - 1
              ? "✅ Submit చేయి"
              : "తర్వాత ప్రశ్న →"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#f57c00",
    padding: 20,
    paddingTop: 50,
  },
  backBtn: { marginBottom: 5 },
  backBtnText: {
    color: "white",
    fontSize: 16,
    fontFamily: "SreeKrushnadevaraya",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    fontFamily: "SreeKrushnadevaraya",
  },
  headerSub: {
    fontSize: 14,
    color: "#ffe0b2",
    fontFamily: "BalooTammudu2",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#ffe0b2",
  },
  progressFill: {
    height: 6,
    backgroundColor: "#f57c00",
  },
  startContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  startIcon: { fontSize: 60, marginBottom: 15 },
  startTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    fontFamily: "SreeKrushnadevaraya",
    marginBottom: 8,
  },
  startSubtitle: {
    fontSize: 16,
    color: "#666",
    fontFamily: "SreeKrushnadevaraya",
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 30,
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 8,
    minWidth: 80,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f57c00",
    fontFamily: "BalooTammudu2",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    fontFamily: "SreeKrushnadevaraya",
  },
  startBtn: {
    backgroundColor: "#f57c00",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
  },
  startBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "SreeKrushnadevaraya",
  },
  backToBtn: { padding: 10 },
  backToBtnText: {
    color: "#666",
    fontSize: 16,
    fontFamily: "SreeKrushnadevaraya",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    fontFamily: "SreeKrushnadevaraya",
    marginBottom: 20,
  },
  quizContent: { flex: 1, padding: 15 },
  questionBox: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  questionNumber: {
    fontSize: 14,
    color: "#f57c00",
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "BalooTammudu2",
  },
  questionText: {
    fontSize: 18,
    color: "#333",
    lineHeight: 26,
    fontFamily: "SreeKrushnadevaraya",
    marginBottom: 8,
  },
  questionType: {
    fontSize: 13,
    color: "#888",
    fontFamily: "BalooTammudu2",
  },
  optionsContainer: { marginBottom: 20 },
  optionBtn: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionBtnSelected: {
    borderColor: "#f57c00",
    backgroundColor: "#fff3e0",
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    width: 30,
    fontFamily: "BalooTammudu2",
  },
  optionLetterSelected: { color: "#f57c00" },
  optionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    fontFamily: "SreeKrushnadevaraya",
  },
  optionTextSelected: { color: "#f57c00" },
  tfContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  tfBtn: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
    backgroundColor: "white",
    marginHorizontal: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  tfTrue: {
    borderColor: "#388e3c",
    backgroundColor: "#e8f5e9",
  },
  tfFalse: {
    borderColor: "#e53935",
    backgroundColor: "#ffebee",
  },
  tfIcon: { fontSize: 36, marginBottom: 8 },
  tfText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "SreeKrushnadevaraya",
  },
  tfTextSelected: { color: "#333" },
  fillContainer: { marginBottom: 20 },
  fillInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#f57c00",
    color: "#333",
    fontFamily: "SreeKrushnadevaraya",
  },
  nextBtn: {
    backgroundColor: "#f57c00",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  nextBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "SreeKrushnadevaraya",
  },
  resultContainer: { flex: 1, padding: 15 },
  scoreBox: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
    borderWidth: 3,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "BalooTammudu2",
  },
  scorePercent: {
    fontSize: 24,
    color: "#666",
    fontFamily: "BalooTammudu2",
  },
  scoreMessage: {
    fontSize: 18,
    color: "#333",
    marginTop: 10,
    fontFamily: "SreeKrushnadevaraya",
    textAlign: "center",
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    fontFamily: "SreeKrushnadevaraya",
  },
  reviewCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    elevation: 1,
  },
  reviewQ: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
    fontFamily: "SreeKrushnadevaraya",
  },
  reviewAnswer: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "SreeKrushnadevaraya",
  },
  correctAnswer: {
    fontSize: 14,
    color: "#388e3c",
    marginTop: 4,
    fontFamily: "SreeKrushnadevaraya",
  },
  restartBtn: {
    backgroundColor: "#f57c00",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  restartBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "SreeKrushnadevaraya",
  },
  exitBtn: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  exitBtnText: {
    color: "#666",
    fontSize: 16,
    fontFamily: "SreeKrushnadevaraya",
  },
});
