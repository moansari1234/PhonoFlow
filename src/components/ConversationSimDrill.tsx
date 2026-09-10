import React, { useState, useRef } from "react";
import { MessageSquare, Mic, Square, Volume2, Sparkles, Send, Bot, User, CheckCircle2, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { ConversationScenario, PracticeAttemptRecord } from "../types";
import { CONVERSATION_SCENARIOS } from "../data/curriculumData";
import { playModelAudio, createSpeechRecognizer } from "../utils/audioUtils";

interface ConversationSimDrillProps {
  onRecordCompleted: (record: PracticeAttemptRecord) => void;
}

export const ConversationSimDrill: React.FC<ConversationSimDrillProps> = ({ onRecordCompleted }) => {
  const [selectedScenario, setSelectedScenario] = useState<ConversationScenario>(CONVERSATION_SCENARIOS[0]);
  const [messages, setMessages] = useState<{ sender: "bot" | "user"; text: string; coaching?: string }[]>([
    { sender: "bot", text: CONVERSATION_SCENARIOS[0].initialPrompt },
  ]);
  const [currentInputText, setCurrentInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const recognizerRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  const handleSelectScenario = (scenario: ConversationScenario) => {
    setSelectedScenario(scenario);
    setMessages([{ sender: "bot", text: scenario.initialPrompt }]);
    setCurrentInputText("");
  };

  const handleStartVoice = () => {
    setIsRecording(true);
    const recognizer = createSpeechRecognizer((text, isFinal) => {
      setCurrentInputText(text);
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
    }
  };

  const handleStopVoice = () => {
    setIsRecording(false);
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || currentInputText.trim();
    if (!text) return;

    // Add user message
    const updatedMessages = [...messages, { sender: "user" as const, text }];
    setMessages(updatedMessages);
    setCurrentInputText("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/conversation-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: selectedScenario,
          history: updatedMessages,
          userSpeech: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.botReply || "That sounds great, let's keep going!",
            coaching: data.accentCoaching || "Good natural pace and thought grouping.",
          },
        ]);

        if (data.botReply) {
          playModelAudio(data.botReply);
        }

        if ((data.score || 85) >= 85) {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        }

        onRecordCompleted({
          id: `conv-${Date.now()}`,
          lessonId: "level-6-capstone-fluency",
          moduleType: "conversation_sim",
          itemText: `${selectedScenario.title}: "${text}"`,
          timestamp: new Date().toISOString(),
          overallScore: data.score || 85,
          actionableTip: data.accentCoaching || "Clear professional speech flow.",
          duration: 3.5,
        });
      }
    } catch (e) {
      console.error("Conversation turn error:", e);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CONVERSATION_SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => handleSelectScenario(sc)}
            className={`p-4 rounded-xl border text-left transition ${
              selectedScenario.id === sc.id
                ? "bg-neutral-100 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                : "bg-white border-neutral-200 opacity-70 hover:opacity-100"
            }`}
          >
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide">{sc.role}</div>
            <div className="text-sm font-bold text-neutral-900 mt-1">{sc.title}</div>
            <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">{sc.context}</p>
          </button>
        ))}
      </div>

      {/* Target Focus Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center space-x-3 text-xs text-neutral-600">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-bold text-emerald-700">Target Accent Focus for this scenario: </span>
          <span>{selectedScenario.targetAccentFocus}</span>
        </div>
      </div>

      {/* Dialogue Thread */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4 max-h-[440px] overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1.5`}
          >
            <div className="flex items-center space-x-2 text-xs text-neutral-500 font-medium">
              {msg.sender === "bot" ? (
                <>
                  <Bot className="w-4 h-4 text-emerald-600" />
                  <span>{selectedScenario.role}</span>
                </>
              ) : (
                <>
                  <span>You (Learner)</span>
                  <User className="w-4 h-4 text-sky-400" />
                </>
              )}
            </div>

            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed max-w-xl ${
                msg.sender === "user"
                  ? "bg-emerald-600 text-white font-medium rounded-tr-none shadow-md"
                  : "bg-[#FAFAFA] border border-neutral-200 text-neutral-900 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>

            {msg.coaching && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 max-w-xl text-xs text-emerald-900 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-800">Coach Accent Feedback:</span>
                  <span className="text-emerald-900 leading-relaxed">{msg.coaching}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center space-x-2 text-xs text-emerald-600 animate-pulse p-2">
            <Bot className="w-4 h-4" />
            <span>{selectedScenario.role} is listening and formulating reply...</span>
          </div>
        )}
      </div>

      {/* Suggested Spoken Responses */}
      {selectedScenario.sampleReplies && selectedScenario.sampleReplies.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">
            Suggested Responses (Tap to practice):
          </span>
          <div className="flex flex-col gap-2">
            {selectedScenario.sampleReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => setCurrentInputText(reply)}
                className="p-3 bg-white hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 text-left rounded-xl text-xs text-neutral-700 transition min-h-[44px] flex items-center"
              >
                "{reply}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Action Bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={currentInputText}
            onChange={(e) => setCurrentInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            placeholder="Type or tap speak..."
            className="w-full bg-[#FAFAFA] border border-neutral-200 rounded-xl px-4 py-3 min-h-[46px] text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-start space-x-2 w-full sm:w-auto shrink-0">
          {!isRecording ? (
            <button
              onClick={handleStartVoice}
              className="flex-1 sm:flex-none px-4 py-3 min-h-[46px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Speak</span>
            </button>
          ) : (
            <button
              onClick={handleStopVoice}
              className="flex-1 sm:flex-none px-4 py-3 min-h-[46px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Done</span>
            </button>
          )}

          <button
            onClick={() => handleSendMessage()}
            disabled={!currentInputText.trim() || isThinking}
            className="flex-1 sm:flex-none px-6 py-3 min-h-[46px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
