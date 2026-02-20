// components/assistant/DecisionJournal.tsx
import React, { useState, useEffect } from 'react';
import {
  Scale,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Target,
  Heart,
  Brain,
  BarChart,
  Download,
  Share2,
  ChevronRight,
} from 'lucide-react';
import { useAssistant } from '../../hooks/useAssistant';
import { Line } from 'react-chartjs-2';

interface Decision {
  id: string;
  context: string;
  options: Array<{
    description: string;
    pros: string[];
    cons: string[];
  }>;
  scores: Array<{
    option: string;
    score: number;
    breakdown: {
      pros: number;
      cons: number;
      goalAlignment: number;
      identityAlignment: number;
      pastPattern: number;
    };
  }>;
  recommendation: string;
  confidence: number;
  chosenOption?: string;
  outcome?: string;
  satisfaction?: number;
  createdAt: string;
}

export const DecisionJournal: React.FC = () => {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [showNewDecision, setShowNewDecision] = useState(false);
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [goals, setGoals] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { getAuthHeaders, userTier } = useAssistant();

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/assistant/decisions', { headers });
      const data = await response.json();
      setDecisions(data.data || []);
      if (data.data?.length > 0) {
        setSelectedDecision(data.data[0]);
      }
    } catch (error) {
      console.error('Failed to load decisions:', error);
    }
  };

  const analyzeDecision = async () => {
    if (!optionA || !optionB) return;

    setIsAnalyzing(true);
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/assistant/decision/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          optionA,
          optionB,
          goals: goals.split(',').map(g => g.trim()),
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadDecisions();
        setShowNewDecision(false);
        setOptionA('');
        setOptionB('');
        setGoals('');
      }
    } catch (error) {
      console.error('Failed to analyze decision:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recordOutcome = async (decisionId: string, outcome: string, satisfaction: number) => {
    try {
      const headers = getAuthHeaders();
      await fetch(`/api/assistant/decisions/${decisionId}/outcome`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ outcome, satisfaction }),
      });
      loadDecisions();
    } catch (error) {
      console.error('Failed to record outcome:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Sidebar - Decision List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Decision Journal</h2>
          <button
            onClick={() => setShowNewDecision(true)}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-1"
          >
            <Scale className="w-4 h-4" />
            New Decision
          </button>
        </div>

        <div className="space-y-2">
          {decisions.map(decision => (
            <button
              key={decision.id}
              onClick={() => setSelectedDecision(decision)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                selectedDecision?.id === decision.id
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card border-border hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium line-clamp-1">{decision.context}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(decision.createdAt).toLocaleDateString()}
                {decision.chosenOption && (
                  <span className="text-green-500">· Decided</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content - Decision Analysis */}
      <div className="lg:col-span-2">
        {showNewDecision ? (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">New Decision Analysis</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Option A</label>
                <input
                  type="text"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary rounded-lg"
                  placeholder="e.g., Learn React"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Option B</label>
                <input
                  type="text"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary rounded-lg"
                  placeholder="e.g., Learn Vue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Relevant Goals (comma separated)
                </label>
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary rounded-lg"
                  placeholder="become frontend developer, build portfolio"
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={analyzeDecision}
                  disabled={isAnalyzing || !optionA || !optionB}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Decision'}
                </button>
                <button
                  onClick={() => setShowNewDecision(false)}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : selectedDecision ? (
          <div className="space-y-6">
            {/* Decision Header */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">{selectedDecision.context}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Analyzed on {new Date(selectedDecision.createdAt).toLocaleDateString()}
              </p>

              {/* Score Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedDecision.scores.map((score, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      idx === 0 ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-purple-50 dark:bg-purple-950/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Option {idx === 0 ? 'A' : 'B'}</span>
                      <span className="text-2xl font-bold">{score.score}</span>
                    </div>
                    <p className="text-sm line-clamp-2 mb-3">{score.option}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Pros</span>
                        <span className="text-green-600">+{score.breakdown.pros}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cons</span>
                        <span className="text-red-600">{score.breakdown.cons}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Goal Alignment</span>
                        <span>{score.breakdown.goalAlignment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Identity Alignment</span>
                        <span>{score.breakdown.identityAlignment}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-primary mb-2">Recommendation</h4>
                <p className="text-sm">{selectedDecision.recommendation}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                    Confidence: {(selectedDecision.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-4">
              {selectedDecision.options.map((option, idx) => (
                <div key={idx} className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">
                    Option {idx === 0 ? 'A' : 'B'}: {option.description}
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        Pros
                      </h5>
                      <ul className="space-y-1">
                        {option.pros.map((pro, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4" />
                        Cons
                      </h5>
                      <ul className="space-y-1">
                        {option.cons.map((con, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-red-500">−</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Outcome Recording (if not already recorded) */}
            {!selectedDecision.chosenOption && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Record Your Decision</h4>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => recordOutcome(selectedDecision.id, 'A', 0)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    I chose Option A
                  </button>
                  <button
                    onClick={() => recordOutcome(selectedDecision.id, 'B', 0)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    I chose Option B
                  </button>
                  <button
                    onClick={() => recordOutcome(selectedDecision.id, 'neither', 0)}
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg"
                  >
                    Neither
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Scale className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Decision Selected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a decision from your journal or analyze a new one
            </p>
            <button
              onClick={() => setShowNewDecision(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Analyze New Decision
            </button>
          </div>
        )}
      </div>
    </div>
  );
};