import { useEffect, useState } from 'react'
import { Call, Message } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Smiley, 
  SmileyMeh, 
  SmileyXEyes, 
  TrendUp, 
  TrendDown, 
  Minus,
  ChartLine,
  Brain,
  Heart,
  Warning,
  Sparkle
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface SentimentAnalysisProps {
  call: Call | null
  className?: string
}

export type SentimentType = 'positive' | 'neutral' | 'negative'

interface SentimentScore {
  overall: SentimentType
  confidence: number
  emotion: string
  trend: 'improving' | 'declining' | 'stable'
  details: {
    positiveScore: number
    neutralScore: number
    negativeScore: number
  }
}

interface MessageSentiment {
  messageId: string
  sentiment: SentimentType
  confidence: number
  timestamp: Date
}

export function SentimentAnalysis({ call, className }: SentimentAnalysisProps) {
  const [currentSentiment, setCurrentSentiment] = useState<SentimentScore>({
    overall: 'neutral',
    confidence: 0,
    emotion: 'Calm',
    trend: 'stable',
    details: {
      positiveScore: 33,
      neutralScore: 34,
      negativeScore: 33
    }
  })
  const [messageSentiments, setMessageSentiments] = useState<MessageSentiment[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    if (call?.messages && call.messages.length > 0) {
      analyzeSentiment(call.messages)
    }
  }, [call?.messages])

  const analyzeSentiment = async (messages: Message[]) => {
    if (messages.length === 0) return

    setIsAnalyzing(true)

    const recentMessages = messages.slice(-5)
    const conversationText = recentMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')

    try {
      const promptText = `You are a sentiment analysis expert for healthcare conversations. Analyze the sentiment of this conversation and provide a detailed assessment.

Conversation:
${conversationText}

Analyze the overall sentiment, emotional tone, and trend. Consider:
1. Patient's emotional state (frustrated, satisfied, worried, calm, etc.)
2. Urgency and stress levels
3. Positive vs negative language
4. Whether the sentiment is improving or declining through the conversation

Return ONLY valid JSON in this exact format:
{
  "overall": "positive" | "neutral" | "negative",
  "confidence": 0-100,
  "emotion": "single word describing emotion",
  "trend": "improving" | "declining" | "stable",
  "details": {
    "positiveScore": 0-100,
    "neutralScore": 0-100,
    "negativeScore": 0-100
  }
}`

      const response = await window.spark.llm(promptText, 'gpt-4o-mini', true)
      const analysis = JSON.parse(response)

      setCurrentSentiment(analysis)

      const newMessageSentiments: MessageSentiment[] = recentMessages.map((msg, idx) => ({
        messageId: msg.id,
        sentiment: idx === recentMessages.length - 1 ? analysis.overall : 
                  (messageSentiments.find(ms => ms.messageId === msg.id)?.sentiment || 'neutral'),
        confidence: idx === recentMessages.length - 1 ? analysis.confidence : 
                   (messageSentiments.find(ms => ms.messageId === msg.id)?.confidence || 0),
        timestamp: msg.timestamp
      }))

      setMessageSentiments(newMessageSentiments)
    } catch (error) {
      console.error('Sentiment analysis error:', error)
      setCurrentSentiment({
        overall: 'neutral',
        confidence: 0,
        emotion: 'Unknown',
        trend: 'stable',
        details: {
          positiveScore: 33,
          neutralScore: 34,
          negativeScore: 33
        }
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSentimentIcon = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive':
        return <Smiley className="w-6 h-6 text-success" weight="fill" />
      case 'neutral':
        return <SmileyMeh className="w-6 h-6 text-warning" weight="fill" />
      case 'negative':
        return <SmileyXEyes className="w-6 h-6 text-destructive" weight="fill" />
    }
  }

  const getSentimentColor = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive':
        return 'text-success'
      case 'neutral':
        return 'text-warning'
      case 'negative':
        return 'text-destructive'
    }
  }

  const getSentimentBgColor = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-success/10 border-success/30'
      case 'neutral':
        return 'bg-warning/10 border-warning/30'
      case 'negative':
        return 'bg-destructive/10 border-destructive/30'
    }
  }

  const getTrendIcon = () => {
    switch (currentSentiment.trend) {
      case 'improving':
        return <TrendUp className="w-5 h-5 text-success" weight="bold" />
      case 'declining':
        return <TrendDown className="w-5 h-5 text-destructive" weight="bold" />
      case 'stable':
        return <Minus className="w-5 h-5 text-muted-foreground" weight="bold" />
    }
  }

  if (!call) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50 p-8', className)}>
        <div className="text-center text-muted-foreground">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" weight="duotone" />
          <p className="text-sm">No active call</p>
          <p className="text-xs mt-1">Sentiment analysis will appear during calls</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50 p-6 overflow-hidden relative', className)}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl -mr-32 -mt-32" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" weight="duotone" />
              Sentiment Analysis
            </h3>
            <p className="text-sm text-muted-foreground">Real-time emotional intelligence</p>
          </div>
          
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkle className="w-4 h-4 text-primary" weight="fill" />
                </motion.div>
                <span className="text-xs font-medium text-primary">Analyzing...</span>
              </motion.div>
            ) : (
              <motion.div
                key="confidence"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full"
              >
                <ChartLine className="w-4 h-4 text-muted-foreground" weight="duotone" />
                <span className="text-xs font-medium text-foreground">
                  {currentSentiment.confidence}% confidence
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <motion.div
            layout
            className={cn(
              'p-6 rounded-2xl border-2 transition-all',
              getSentimentBgColor(currentSentiment.overall)
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Overall Sentiment</span>
              <motion.div
                key={currentSentiment.overall}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {getSentimentIcon(currentSentiment.overall)}
              </motion.div>
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <p className={cn('text-3xl font-bold capitalize mb-1', getSentimentColor(currentSentiment.overall))}>
                  {currentSentiment.overall}
                </p>
                <p className="text-sm text-muted-foreground">Current state</p>
              </div>
              
              <div className="flex flex-col items-end">
                {getTrendIcon()}
                <p className="text-xs text-muted-foreground mt-1 capitalize">{currentSentiment.trend}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            layout
            className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-border/50"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Emotional State</span>
              <Heart className="w-5 h-5 text-primary" weight="duotone" />
            </div>
            
            <div>
              <p className="text-3xl font-bold text-foreground mb-1 capitalize">
                {currentSentiment.emotion}
              </p>
              <p className="text-sm text-muted-foreground">Detected emotion</p>
            </div>

            {call.triageLevel && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Warning className="w-4 h-4 text-warning" weight="fill" />
                  <span className="text-xs font-medium text-muted-foreground">Triage:</span>
                  <Badge 
                    className={cn(
                      'capitalize',
                      call.triageLevel === 'emergency' && 'bg-destructive/20 text-destructive border-destructive/30',
                      call.triageLevel === 'urgent' && 'bg-warning/20 text-warning border-warning/30',
                      call.triageLevel === 'routine' && 'bg-success/20 text-success border-success/30'
                    )}
                  >
                    {call.triageLevel}
                  </Badge>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Sentiment Breakdown</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Smiley className="w-4 h-4 text-success" weight="fill" />
                  <span className="text-sm font-medium text-foreground">Positive</span>
                </div>
                <span className="text-sm font-bold text-success">{currentSentiment.details.positiveScore}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentSentiment.details.positiveScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-success/80 to-success rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SmileyMeh className="w-4 h-4 text-warning" weight="fill" />
                  <span className="text-sm font-medium text-foreground">Neutral</span>
                </div>
                <span className="text-sm font-bold text-warning">{currentSentiment.details.neutralScore}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentSentiment.details.neutralScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="h-full bg-gradient-to-r from-warning/80 to-warning rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SmileyXEyes className="w-4 h-4 text-destructive" weight="fill" />
                  <span className="text-sm font-medium text-foreground">Negative</span>
                </div>
                <span className="text-sm font-bold text-destructive">{currentSentiment.details.negativeScore}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currentSentiment.details.negativeScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-destructive/80 to-destructive rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        {messageSentiments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-4">Sentiment Timeline</h4>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <AnimatePresence>
                {messageSentiments.map((ms, idx) => (
                  <motion.div
                    key={ms.messageId}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all',
                      getSentimentBgColor(ms.sentiment)
                    )}
                    title={`${ms.sentiment} (${ms.confidence}%)`}
                  >
                    {getSentimentIcon(ms.sentiment)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">Oldest</span>
              <span className="text-xs text-muted-foreground">Latest</span>
            </div>
          </div>
        )}

        {currentSentiment.overall === 'negative' && call.state === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
          >
            <div className="flex items-start gap-3">
              <Warning className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" weight="fill" />
              <div>
                <p className="text-sm font-semibold text-destructive mb-1">Attention Needed</p>
                <p className="text-xs text-muted-foreground">
                  Caller sentiment is negative. Consider offering additional support or escalating to a supervisor.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {currentSentiment.trend === 'improving' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl bg-success/10 border border-success/30"
          >
            <div className="flex items-start gap-3">
              <TrendUp className="w-5 h-5 text-success flex-shrink-0 mt-0.5" weight="fill" />
              <div>
                <p className="text-sm font-semibold text-success mb-1">Positive Progress</p>
                <p className="text-xs text-muted-foreground">
                  Caller sentiment is improving. Continue with current approach.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  )
}
