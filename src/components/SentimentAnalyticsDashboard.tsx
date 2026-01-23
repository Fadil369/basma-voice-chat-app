import { useMemo } from 'react'
import { Call } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  Smiley, 
  SmileyMeh, 
  SmileyXEyes, 
  TrendUp, 
  TrendDown,
  ChartLine,
  Brain,
  Phone,
  Clock,
  CalendarBlank,
  ArrowRight
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface SentimentAnalyticsDashboardProps {
  calls: Call[]
  className?: string
}

type SentimentType = 'positive' | 'neutral' | 'negative'

interface CallSentimentData {
  callId: string
  callerName: string
  date: Date
  duration: number
  sentiment: SentimentType
  emotionalJourney: SentimentType[]
  messageCount: number
  department?: string
  triageLevel?: string
}

interface SentimentTrend {
  date: string
  positive: number
  neutral: number
  negative: number
  totalCalls: number
}

export function SentimentAnalyticsDashboard({ calls, className }: SentimentAnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    const completedCalls = calls.filter(c => c.state === 'completed')
    
    const callSentiments: CallSentimentData[] = completedCalls.map(call => {
      const sentiment = analyzCallSentiment(call)
      const duration = call.endTime && call.startTime 
        ? Math.floor((new Date(call.endTime).getTime() - new Date(call.startTime).getTime()) / 1000)
        : 0
      
      return {
        callId: call.id,
        callerName: call.callerName,
        date: new Date(call.startTime),
        duration,
        sentiment: sentiment.overall,
        emotionalJourney: sentiment.journey,
        messageCount: call.messages.length,
        department: call.department,
        triageLevel: call.triageLevel
      }
    })

    const totalCalls = callSentiments.length
    const positiveCalls = callSentiments.filter(c => c.sentiment === 'positive').length
    const neutralCalls = callSentiments.filter(c => c.sentiment === 'neutral').length
    const negativeCalls = callSentiments.filter(c => c.sentiment === 'negative').length

    const positivePercentage = totalCalls > 0 ? Math.round((positiveCalls / totalCalls) * 100) : 0
    const neutralPercentage = totalCalls > 0 ? Math.round((neutralCalls / totalCalls) * 100) : 0
    const negativePercentage = totalCalls > 0 ? Math.round((negativeCalls / totalCalls) * 100) : 0

    const avgDuration = totalCalls > 0 
      ? Math.round(callSentiments.reduce((sum, c) => sum + c.duration, 0) / totalCalls)
      : 0

    const trends = generateTrends(callSentiments)

    const improvingCalls = callSentiments.filter(c => {
      if (c.emotionalJourney.length < 2) return false
      const first = c.emotionalJourney[0]
      const last = c.emotionalJourney[c.emotionalJourney.length - 1]
      return getSentimentScore(last) > getSentimentScore(first)
    }).length

    const decliningCalls = callSentiments.filter(c => {
      if (c.emotionalJourney.length < 2) return false
      const first = c.emotionalJourney[0]
      const last = c.emotionalJourney[c.emotionalJourney.length - 1]
      return getSentimentScore(last) < getSentimentScore(first)
    }).length

    return {
      totalCalls,
      positiveCalls,
      neutralCalls,
      negativeCalls,
      positivePercentage,
      neutralPercentage,
      negativePercentage,
      avgDuration,
      callSentiments: callSentiments.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10),
      trends,
      improvingCalls,
      decliningCalls
    }
  }, [calls])

  const analyzCallSentiment = (call: Call): { overall: SentimentType, journey: SentimentType[] } => {
    const messages = call.messages.filter(m => m.role === 'user')
    
    if (messages.length === 0) {
      return { overall: 'neutral', journey: [] }
    }

    const journey: SentimentType[] = messages.map(msg => {
      const content = msg.content.toLowerCase()
      
      const positiveKeywords = ['thank', 'شكرا', 'good', 'great', 'جيد', 'ممتاز', 'happy', 'سعيد']
      const negativeKeywords = ['problem', 'issue', 'angry', 'مشكلة', 'غاضب', 'urgent', 'عاجل', 'pain', 'ألم']
      
      const positiveCount = positiveKeywords.filter(kw => content.includes(kw)).length
      const negativeCount = negativeKeywords.filter(kw => content.includes(kw)).length
      
      if (positiveCount > negativeCount) return 'positive'
      if (negativeCount > positiveCount) return 'negative'
      return 'neutral'
    })

    const positiveCount = journey.filter(s => s === 'positive').length
    const negativeCount = journey.filter(s => s === 'negative').length
    
    let overall: SentimentType = 'neutral'
    if (positiveCount > negativeCount) overall = 'positive'
    else if (negativeCount > positiveCount) overall = 'negative'

    return { overall, journey }
  }

  const getSentimentScore = (sentiment: SentimentType): number => {
    switch (sentiment) {
      case 'positive': return 2
      case 'neutral': return 1
      case 'negative': return 0
    }
  }

  const generateTrends = (callSentiments: CallSentimentData[]): SentimentTrend[] => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    return last7Days.map(dateStr => {
      const daysCalls = callSentiments.filter(c => 
        c.date.toISOString().split('T')[0] === dateStr
      )
      
      const positive = daysCalls.filter(c => c.sentiment === 'positive').length
      const neutral = daysCalls.filter(c => c.sentiment === 'neutral').length
      const negative = daysCalls.filter(c => c.sentiment === 'negative').length
      
      return {
        date: dateStr,
        positive,
        neutral,
        negative,
        totalCalls: daysCalls.length
      }
    })
  }

  const getSentimentIcon = (sentiment: SentimentType, size: string = 'w-5 h-5') => {
    switch (sentiment) {
      case 'positive':
        return <Smiley className={`${size} text-success`} weight="fill" />
      case 'neutral':
        return <SmileyMeh className={`${size} text-warning`} weight="fill" />
      case 'negative':
        return <SmileyXEyes className={`${size} text-destructive`} weight="fill" />
    }
  }

  const getSentimentColor = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive': return 'text-success'
      case 'neutral': return 'text-warning'
      case 'negative': return 'text-destructive'
    }
  }

  const getSentimentBgColor = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'positive': return 'bg-success/10 border-success/30'
      case 'neutral': return 'bg-warning/10 border-warning/30'
      case 'negative': return 'bg-destructive/10 border-destructive/30'
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date): string => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (analytics.totalCalls === 0) {
    return (
      <Card className={cn('bg-card/50 backdrop-blur-sm border-border/50 p-12 text-center', className)}>
        <Brain className="w-16 h-16 mx-auto mb-4 opacity-50 text-primary" weight="duotone" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Call Data Yet</h3>
        <p className="text-sm text-muted-foreground">
          Complete some calls to view sentiment analytics and trends
        </p>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" weight="duotone" />
            Sentiment Analytics
          </h2>
          <p className="text-muted-foreground">Historical trends across {analytics.totalCalls} calls</p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
          <ChartLine className="w-5 h-5 text-primary" weight="duotone" />
          <span className="text-sm font-medium text-primary">Last 7 Days</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-success/20">
                <Smiley className="w-6 h-6 text-success" weight="fill" />
              </div>
              <Badge className="bg-success/20 text-success border-success/30">
                {analytics.positivePercentage}%
              </Badge>
            </div>
            <p className="text-3xl font-bold text-success mb-1">{analytics.positiveCalls}</p>
            <p className="text-sm text-muted-foreground">Positive Calls</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-warning/20">
                <SmileyMeh className="w-6 h-6 text-warning" weight="fill" />
              </div>
              <Badge className="bg-warning/20 text-warning border-warning/30">
                {analytics.neutralPercentage}%
              </Badge>
            </div>
            <p className="text-3xl font-bold text-warning mb-1">{analytics.neutralCalls}</p>
            <p className="text-sm text-muted-foreground">Neutral Calls</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-destructive/20">
                <SmileyXEyes className="w-6 h-6 text-destructive" weight="fill" />
              </div>
              <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                {analytics.negativePercentage}%
              </Badge>
            </div>
            <p className="text-3xl font-bold text-destructive mb-1">{analytics.negativeCalls}</p>
            <p className="text-sm text-muted-foreground">Negative Calls</p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-border/50">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Clock className="w-6 h-6 text-primary" weight="duotone" />
              </div>
              <Badge className="bg-muted/50 text-foreground">Avg</Badge>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{formatDuration(analytics.avgDuration)}</p>
            <p className="text-sm text-muted-foreground">Call Duration</p>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <ChartLine className="w-5 h-5 text-primary" weight="duotone" />
              7-Day Sentiment Trend
            </h3>

            <div className="space-y-4">
              {analytics.trends.map((trend, idx) => {
                const date = new Date(trend.date)
                const maxCalls = Math.max(...analytics.trends.map(t => t.totalCalls), 1)
                
                return (
                  <motion.div
                    key={trend.date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarBlank className="w-4 h-4 text-muted-foreground" weight="duotone" />
                        <span className="font-medium text-foreground">
                          {formatDate(date)}
                        </span>
                      </div>
                      <span className="text-muted-foreground">{trend.totalCalls} calls</span>
                    </div>

                    {trend.totalCalls > 0 ? (
                      <div className="flex items-center gap-1 h-8">
                        {trend.positive > 0 && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(trend.positive / maxCalls) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="h-full bg-gradient-to-r from-success to-success/80 rounded-l-lg flex items-center justify-center"
                            title={`${trend.positive} positive`}
                          >
                            {trend.positive > 0 && (
                              <span className="text-xs font-bold text-white px-2">
                                {trend.positive}
                              </span>
                            )}
                          </motion.div>
                        )}
                        {trend.neutral > 0 && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(trend.neutral / maxCalls) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className={cn(
                              'h-full bg-gradient-to-r from-warning to-warning/80 flex items-center justify-center',
                              trend.positive === 0 && 'rounded-l-lg',
                              trend.negative === 0 && 'rounded-r-lg'
                            )}
                            title={`${trend.neutral} neutral`}
                          >
                            {trend.neutral > 0 && (
                              <span className="text-xs font-bold text-white px-2">
                                {trend.neutral}
                              </span>
                            )}
                          </motion.div>
                        )}
                        {trend.negative > 0 && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(trend.negative / maxCalls) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="h-full bg-gradient-to-r from-destructive to-destructive/80 rounded-r-lg flex items-center justify-center"
                            title={`${trend.negative} negative`}
                          >
                            {trend.negative > 0 && (
                              <span className="text-xs font-bold text-white px-2">
                                {trend.negative}
                              </span>
                            )}
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="h-8 bg-muted/30 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">No calls</span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-xs text-muted-foreground">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-xs text-muted-foreground">Negative</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h3 className="text-lg font-bold text-foreground mb-6">Sentiment Journey</h3>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendUp className="w-5 h-5 text-success" weight="bold" />
                    <span className="text-sm font-medium text-foreground">Improving</span>
                  </div>
                  <Badge className="bg-success/20 text-success border-success/30">
                    {analytics.improvingCalls}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calls that ended more positively
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendDown className="w-5 h-5 text-destructive" weight="bold" />
                    <span className="text-sm font-medium text-foreground">Declining</span>
                  </div>
                  <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                    {analytics.decliningCalls}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calls that ended more negatively
                </p>
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-3">Overall Performance</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-bold text-success">
                      {analytics.totalCalls > 0 
                        ? Math.round(((analytics.positiveCalls + analytics.improvingCalls) / analytics.totalCalls) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: analytics.totalCalls > 0 
                          ? `${((analytics.positiveCalls + analytics.improvingCalls) / analytics.totalCalls) * 100}%`
                          : '0%'
                      }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full bg-gradient-to-r from-success to-success/80 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" weight="duotone" />
            Recent Call Sentiments
          </h3>

          <div className="space-y-3">
            {analytics.callSentiments.map((call, idx) => (
              <motion.div
                key={call.callId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + idx * 0.05 }}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all hover:shadow-lg cursor-pointer',
                  getSentimentBgColor(call.sentiment)
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{call.callerName}</p>
                      {getSentimentIcon(call.sentiment, 'w-5 h-5')}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarBlank className="w-3 h-3" />
                        {formatDate(call.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(call.duration)}
                      </span>
                      <span>{call.messageCount} messages</span>
                    </div>
                  </div>
                  
                  <Badge className={cn('capitalize', getSentimentColor(call.sentiment))}>
                    {call.sentiment}
                  </Badge>
                </div>

                {call.emotionalJourney.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Emotional Journey</p>
                    <div className="flex items-center gap-1.5">
                      {call.emotionalJourney.map((sentiment, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          {getSentimentIcon(sentiment, 'w-4 h-4')}
                          {idx < call.emotionalJourney.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-muted-foreground" weight="bold" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(call.department || call.triageLevel) && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                    {call.department && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {call.department}
                      </Badge>
                    )}
                    {call.triageLevel && (
                      <Badge 
                        variant="outline"
                        className={cn(
                          'text-xs capitalize',
                          call.triageLevel === 'emergency' && 'border-destructive/50 text-destructive',
                          call.triageLevel === 'urgent' && 'border-warning/50 text-warning',
                          call.triageLevel === 'routine' && 'border-success/50 text-success'
                        )}
                      >
                        {call.triageLevel}
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {analytics.callSentiments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No recent call data available</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
