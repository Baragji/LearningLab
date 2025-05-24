// apps/api/src/controllers/quizAttempt.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, ProgressStatus } from '@prisma/client';
import {
  StartQuizAttemptInput,
  SubmitAnswerInput,
  CompleteQuizAttemptInput,
} from '@repo/core';

const prisma = new PrismaClient();

/**
 * Henter alle quiz-forsøg for en bruger
 */
export const getUserQuizAttempts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId },
      include: {
        quiz: true,
        _count: {
          select: { userAnswers: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    res.status(200).json(quizAttempts);
  } catch (error) {
    console.error(
      `Fejl ved hentning af quiz-forsøg for bruger ${userId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af quiz-forsøg' });
  }
};

/**
 * Henter et specifikt quiz-forsøg ud fra ID
 */
export const getQuizAttemptById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id: Number(id) },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answerOptions: true,
              },
            },
          },
        },
        userAnswers: {
          include: {
            question: true,
            selectedAnswerOption: true,
          },
        },
      },
    });

    if (!quizAttempt) {
      res.status(404).json({ message: 'Quiz-forsøget blev ikke fundet' });
      return;
    }

    // Tjek om quiz-forsøget tilhører den aktuelle bruger
    if (quizAttempt.userId !== userId) {
      res
        .status(403)
        .json({ message: 'Du har ikke adgang til dette quiz-forsøg' });
      return;
    }

    res.status(200).json(quizAttempt);
  } catch (error) {
    console.error(`Fejl ved hentning af quiz-forsøg med id ${id}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved hentning af quiz-forsøget' });
  }
};

/**
 * Starter et nyt quiz-forsøg
 */
export const startQuizAttempt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { quizId }: StartQuizAttemptInput = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om quizzen eksisterer
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      res.status(404).json({ message: 'Den angivne quiz findes ikke' });
      return;
    }

    // Tjek om quizzen har spørgsmål
    if (quiz.questions.length === 0) {
      res.status(400).json({ message: 'Quizzen har ingen spørgsmål' });
      return;
    }

    // Opret et nyt quiz-forsøg
    const newQuizAttempt = await prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        score: 0,
        startedAt: new Date(),
      },
    });

    // Opdater eller opret brugerens fremskridt for denne quiz
    const existingProgress = await prisma.userProgress.findFirst({
      where: {
        userId,
        quizId,
      },
    });

    if (existingProgress) {
      await prisma.userProgress.update({
        where: { id: existingProgress.id },
        data: {
          status: ProgressStatus.IN_PROGRESS,
          quizAttemptId: newQuizAttempt.id,
        },
      });
    } else {
      await prisma.userProgress.create({
        data: {
          userId,
          quizId,
          status: ProgressStatus.IN_PROGRESS,
          quizAttemptId: newQuizAttempt.id,
        },
      });
    }

    res.status(201).json(newQuizAttempt);
  } catch (error) {
    console.error(`Fejl ved start af quiz-forsøg for quiz ${quizId}:`, error);
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved start af quiz-forsøget' });
  }
};

/**
 * Indsender et svar på et spørgsmål i et quiz-forsøg
 */
export const submitAnswer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    quizAttemptId,
    questionId,
    selectedAnswerOptionId,
    inputText,
    codeAnswer,
    dragDropAnswer,
  } = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om quiz-forsøget eksisterer og tilhører brugeren
    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id: quizAttemptId },
      include: { quiz: true },
    });

    if (!quizAttempt) {
      res.status(404).json({ message: 'Quiz-forsøget blev ikke fundet' });
      return;
    }

    if (quizAttempt.userId !== userId) {
      res
        .status(403)
        .json({ message: 'Du har ikke adgang til dette quiz-forsøg' });
      return;
    }

    // Tjek om quiz-forsøget er afsluttet
    if (quizAttempt.completedAt) {
      res.status(400).json({ message: 'Quiz-forsøget er allerede afsluttet' });
      return;
    }

    // Tjek om spørgsmålet eksisterer og tilhører quizzen
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { answerOptions: true },
    });

    if (!question) {
      res.status(404).json({ message: 'Spørgsmålet blev ikke fundet' });
      return;
    }

    if (question.quizId !== quizAttempt.quizId) {
      res.status(400).json({ message: 'Spørgsmålet tilhører ikke denne quiz' });
      return;
    }

    // Tjek om der allerede er et svar på dette spørgsmål i dette forsøg
    const existingAnswer = await prisma.userAnswer.findFirst({
      where: {
        quizAttemptId,
        questionId,
      },
    });

    // Forbered data baseret på spørgsmålstypen
    const answerData = {
      selectedAnswerOptionId: selectedAnswerOptionId || null,
      inputText: inputText || null,
      codeAnswer: codeAnswer || null,
      dragDropAnswer: dragDropAnswer || null,
    };

    // Hvis der er et eksisterende svar, opdater det
    if (existingAnswer) {
      const updatedAnswer = await prisma.userAnswer.update({
        where: { id: existingAnswer.id },
        data: answerData,
      });

      res.status(200).json(updatedAnswer);
      return;
    }

    // Ellers opret et nyt svar
    const newAnswer = await prisma.userAnswer.create({
      data: {
        quizAttemptId,
        questionId,
        ...answerData,
      },
    });

    res.status(201).json(newAnswer);
  } catch (error) {
    console.error(
      `Fejl ved indsendelse af svar for quiz-forsøg ${quizAttemptId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved indsendelse af svaret' });
  }
};

/**
 * Afslutter et quiz-forsøg og beregner scoren
 */
export const completeQuizAttempt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { quizAttemptId }: CompleteQuizAttemptInput = req.body;
  const userId = (req.user as any)?.id as number;

  if (!userId) {
    res.status(401).json({ message: 'Ikke autoriseret' });
    return;
  }

  try {
    // Tjek om quiz-forsøget eksisterer og tilhører brugeren
    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id: quizAttemptId },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                answerOptions: true,
              },
            },
          },
        },
        userAnswers: {
          include: {
            selectedAnswerOption: true,
            question: true,
          },
        },
      },
    });

    if (!quizAttempt) {
      res.status(404).json({ message: 'Quiz-forsøget blev ikke fundet' });
      return;
    }

    if (quizAttempt.userId !== userId) {
      res
        .status(403)
        .json({ message: 'Du har ikke adgang til dette quiz-forsøg' });
      return;
    }

    // Tjek om quiz-forsøget allerede er afsluttet
    if (quizAttempt.completedAt) {
      res.status(400).json({ message: 'Quiz-forsøget er allerede afsluttet' });
      return;
    }

    // Beregn scoren
    let totalPoints = 0;
    let earnedPoints = 0;
    const userAnswersWithFeedback = [];

    // For hvert spørgsmål, tjek om svaret er korrekt baseret på spørgsmålstypen
    for (const question of quizAttempt.quiz.questions) {
      const userAnswer = quizAttempt.userAnswers.find(
        (answer) => answer.questionId === question.id,
      );

      // Tilføj spørgsmålets point til total
      const questionPoints = question.points || 1;
      totalPoints += questionPoints;

      let isCorrect = false;
      let answerScore = 0;
      let feedback = '';

      if (userAnswer) {
        // Evaluer svaret baseret på spørgsmålstypen
        switch (question.type) {
          case 'MULTIPLE_CHOICE':
            // Tjek om det valgte svar er korrekt
            if (
              userAnswer.selectedAnswerOption &&
              userAnswer.selectedAnswerOption.isCorrect
            ) {
              isCorrect = true;
              answerScore = questionPoints;
              feedback = 'Korrekt svar!';
            } else {
              feedback = 'Forkert svar. ';
              // Find det korrekte svar til feedback
              const correctOption = question.answerOptions.find(
                (option) => option.isCorrect,
              );
              if (correctOption) {
                feedback += `Det korrekte svar er: ${correctOption.text}`;
              }
            }
            break;

          case 'FILL_IN_BLANK':
            // Tjek om det indtastede svar matcher et af de korrekte svar
            const correctAnswers = question.answerOptions
              .filter((option) => option.isCorrect)
              .map((option) => option.text.toLowerCase().trim());

            if (
              userAnswer.inputText &&
              correctAnswers.includes(userAnswer.inputText.toLowerCase().trim())
            ) {
              isCorrect = true;
              answerScore = questionPoints;
              feedback = 'Korrekt svar!';
            } else {
              feedback = 'Forkert svar. ';
              if (correctAnswers.length > 0) {
                feedback += `Korrekte svar inkluderer: ${correctAnswers.join(', ')}`;
              }
            }
            break;

          case 'MATCHING':
            // For matching spørgsmål, tjek om alle par er korrekt matchet
            if (userAnswer.inputText) {
              try {
                const userMatches = JSON.parse(userAnswer.inputText);
                const correctMatches = question.answerOptions.reduce(
                  (acc, option) => {
                    if (option.isCorrect && option.text.includes('::')) {
                      const [key, value] = option.text.split('::');
                      acc[key.trim()] = value.trim();
                    }
                    return acc;
                  },
                  {},
                );

                const totalPairs = Object.keys(correctMatches).length;
                let correctPairs = 0;

                for (const [key, value] of Object.entries(userMatches)) {
                  if (correctMatches[key] === value) {
                    correctPairs++;
                  }
                }

                if (correctPairs === totalPairs) {
                  isCorrect = true;
                  answerScore = questionPoints;
                  feedback = 'Alle par er korrekt matchet!';
                } else {
                  // Delvis point for delvis korrekte svar
                  const partialScore =
                    (correctPairs / totalPairs) * questionPoints;
                  answerScore = Math.round(partialScore);
                  feedback = `${correctPairs} ud af ${totalPairs} par er korrekt matchet.`;
                }
              } catch (e) {
                feedback = 'Ugyldigt svarformat for matching-spørgsmål.';
              }
            } else {
              feedback = 'Intet svar givet.';
            }
            break;

          case 'DRAG_AND_DROP':
            // For drag-and-drop spørgsmål, tjek om elementerne er placeret korrekt
            if (userAnswer.dragDropAnswer) {
              try {
                const userArrangement =
                  typeof userAnswer.dragDropAnswer === 'string'
                    ? JSON.parse(userAnswer.dragDropAnswer)
                    : userAnswer.dragDropAnswer;

                const correctArrangement = question.dragDropItems
                  ? typeof question.dragDropItems === 'string'
                    ? JSON.parse(question.dragDropItems)
                    : question.dragDropItems
                  : [];

                if (correctArrangement.solution) {
                  const totalItems = correctArrangement.solution.length;
                  let correctItems = 0;

                  for (let i = 0; i < totalItems; i++) {
                    if (userArrangement[i] === correctArrangement.solution[i]) {
                      correctItems++;
                    }
                  }

                  if (correctItems === totalItems) {
                    isCorrect = true;
                    answerScore = questionPoints;
                    feedback = 'Alle elementer er korrekt placeret!';
                  } else {
                    // Delvis point for delvis korrekte svar
                    const partialScore =
                      (correctItems / totalItems) * questionPoints;
                    answerScore = Math.round(partialScore);
                    feedback = `${correctItems} ud af ${totalItems} elementer er korrekt placeret.`;
                  }
                }
              } catch (e) {
                feedback = 'Ugyldigt svarformat for drag-and-drop-spørgsmål.';
              }
            } else {
              feedback = 'Intet svar givet.';
            }
            break;

          case 'CODE':
            // For kodespørgsmål, tjek om output matcher forventet output
            if (userAnswer.codeAnswer) {
              // Her ville man normalt køre koden og sammenligne output
              // I denne simple implementering tjekker vi blot om svaret indeholder forventet output
              if (
                question.expectedOutput &&
                userAnswer.codeAnswer.includes(question.expectedOutput)
              ) {
                isCorrect = true;
                answerScore = questionPoints;
                feedback = 'Koden producerer det forventede output!';
              } else {
                feedback = 'Koden producerer ikke det forventede output. ';
                if (question.expectedOutput) {
                  feedback += `Forventet output: ${question.expectedOutput}`;
                }
              }
            } else {
              feedback = 'Ingen kode indsendt.';
            }
            break;

          case 'ESSAY':
            // For essay-spørgsmål, tjek om længden er inden for grænserne
            // Bemærk: Faktisk vurdering af essay-svar kræver manuel gennemgang
            if (userAnswer.inputText) {
              const wordCount = userAnswer.inputText
                .split(/\s+/)
                .filter(Boolean).length;
              const minWords = question.essayMinWords || 0;
              const maxWords = question.essayMaxWords || Infinity;

              if (wordCount >= minWords && wordCount <= maxWords) {
                // For essay giver vi fuld point for svar inden for ordgrænsen
                // Faktisk vurdering ville kræve manuel gennemgang
                isCorrect = true;
                answerScore = questionPoints;
                feedback = `Essay modtaget (${wordCount} ord). Det vil blive gennemgået.`;
              } else if (wordCount < minWords) {
                feedback = `Essay er for kort. Minimum ${minWords} ord krævet, du skrev ${wordCount} ord.`;
              } else {
                feedback = `Essay er for langt. Maksimum ${maxWords} ord tilladt, du skrev ${wordCount} ord.`;
              }
            } else {
              feedback = 'Intet essay indsendt.';
            }
            break;

          default:
            feedback = 'Ukendt spørgsmålstype.';
        }

        // Opdater brugerens svar med vurdering
        await prisma.userAnswer.update({
          where: { id: userAnswer.id },
          data: {
            isCorrect,
            score: answerScore,
            feedback,
          },
        });

        userAnswersWithFeedback.push({
          ...userAnswer,
          isCorrect,
          score: answerScore,
          feedback,
        });

        // Tilføj point til total score
        earnedPoints += answerScore;
      } else {
        // Intet svar givet
        userAnswersWithFeedback.push({
          questionId: question.id,
          isCorrect: false,
          score: 0,
          feedback: 'Intet svar givet.',
        });
      }
    }

    // Beregn procentvis score (0-100)
    const percentageScore =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    // Opdater quiz-forsøget med score og afslutningsdato
    const updatedQuizAttempt = await prisma.quizAttempt.update({
      where: { id: quizAttemptId },
      data: {
        score: percentageScore,
        completedAt: new Date(),
      },
    });

    // Opdater brugerens fremskridt for denne quiz
    await prisma.userProgress.updateMany({
      where: {
        userId,
        quizId: quizAttempt.quizId,
      },
      data: {
        status: ProgressStatus.COMPLETED,
        score: percentageScore,
      },
    });

    // Tjek om brugeren har bestået quizzen og om der skal udstedes et certifikat
    if (quizAttempt.quiz.issueCertificate) {
      const passingScore = quizAttempt.quiz.passingScore || 70; // Default 70% hvis ikke angivet
      if (percentageScore >= passingScore) {
        // Tjek om der allerede er udstedt et certifikat for denne quiz til brugeren
        const existingCertificate = await prisma.certificate.findFirst({
          where: {
            userId,
            quizId: quizAttempt.quizId,
            deletedAt: null,
          },
        });

        if (!existingCertificate) {
          // Generer et unikt certifikat-ID (kræver uuid pakke)
          const certificateId = `CERT-${Date.now()}-${userId}-${quizAttempt.quizId}`;

          // Opret certifikatet
          await prisma.certificate.create({
            data: {
              userId,
              quizId: quizAttempt.quizId,
              score: percentageScore,
              issueDate: new Date(),
              certificateId,
              title: `Certifikat for ${quizAttempt.quiz.title}`,
              description: `Dette certifikat bekræfter, at brugeren har gennemført og bestået quizzen "${quizAttempt.quiz.title}" med en score på ${percentageScore}%.`,
            },
          });
        }
      }
    }

    res.status(200).json({
      ...updatedQuizAttempt,
      totalPoints,
      earnedPoints,
      percentageScore,
      answers: userAnswersWithFeedback,
    });
  } catch (error) {
    console.error(
      `Fejl ved afslutning af quiz-forsøg ${quizAttemptId}:`,
      error,
    );
    res
      .status(500)
      .json({ message: 'Der opstod en fejl ved afslutning af quiz-forsøget' });
  }
};
