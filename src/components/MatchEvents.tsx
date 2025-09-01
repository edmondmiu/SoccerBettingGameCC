import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Clock, MessageSquare, Target, Zap, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react';
import { ActionEvent, Bet } from '../App';

interface MatchEventsProps {
  events: ActionEvent[];
  currentTime: number;
  activeBets: Bet[];
  simplified?: boolean;
}

export function MatchEvents({ events, currentTime, activeBets, simplified = false }: MatchEventsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const formatTime = (seconds: number): string => {
    return `${seconds}s`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="text-green-500" size={16} />;
      case 'action':
        return <Zap className="text-orange-500" size={16} />;
      case 'commentary':
        return <MessageSquare className="text-blue-500" size={16} />;
      default:
        return <Clock className="text-muted-foreground" size={16} />;
    }
  };

  const getEventBadge = (event: ActionEvent) => {
    switch (event.type) {
      case 'goal':
        return <Badge variant="destructive" className="text-xs">GOAL</Badge>;
      case 'action':
        return <Badge variant="default" className="text-xs">BET</Badge>;
      case 'commentary':
        return <Badge variant="secondary" className="text-xs">INFO</Badge>;
      default:
        return null;
    }
  };

  // Helper function to find user's bet on an action event
  const getUserBetForEvent = (event: ActionEvent): Bet | undefined => {
    if (event.type !== 'action') return undefined;
    
    // First try to match by eventId (more reliable)
    let userBet = activeBets.find(bet => 
      bet.type === 'action' && 
      bet.eventId === event.id
    );
    
    // If no eventId match, fall back to timestamp matching for older bets
    if (!userBet) {
      const eventTime = event.time * 1000; // Convert to milliseconds
      userBet = activeBets.find(bet => 
        bet.type === 'action' && 
        Math.abs(bet.timestamp - eventTime) < 30000 // Within 30 seconds
      );
    }
    
    return userBet;
  };

  // Show events that have occurred (time has passed)
  const pastEvents = events
    .filter(event => event.time <= currentTime)
    .sort((a, b) => b.time - a.time) // Most recent first
    .slice(0, 8); // Show last 8 events for mobile

  // Show upcoming events
  const upcomingEvents = events
    .filter(event => event.time > currentTime && event.time <= currentTime + 30) // Next 30 seconds
    .sort((a, b) => a.time - b.time) // Earliest first
    .slice(0, 2); // Show next 2 events

  // Get the most recent event for collapsed view
  const mostRecentEvent = pastEvents[0];

  // Helper function to render an event item
  const renderEventItem = (event: ActionEvent, isCompact: boolean = false) => (
    <div key={event.id} className={`border border-white/10 rounded-lg p-3 ${isCompact ? 'border-transparent bg-transparent p-0' : 'bg-gradient-to-r from-slate-800/20 to-slate-700/20'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getEventIcon(event.type)}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white">
              {formatTime(event.time)}
            </span>
            {getEventBadge(event)}
          </div>
          <p className="text-sm text-gray-300">
            {event.description}
          </p>
        </div>
      </div>
      
      {!isCompact && event.bettingOptions && (
        <div className="ml-6 space-y-1 mt-2">
          {event.bettingOptions.map((option, index) => (
            <div key={index} className="flex justify-between text-xs text-gray-400 bg-black/20 rounded px-2 py-1">
              <span>{option.label}</span>
              <span>@{option.odds}</span>
            </div>
          ))}
        </div>
      )}
      
      {!isCompact && event.resolved && event.result && (
        <div className="ml-6 mt-2">
          <Badge variant="outline" className="text-xs border-green-400/30 text-green-300">
            Result: {event.result}
          </Badge>
        </div>
      )}

      {/* Show user's bet if they placed one on this action event */}
      {!isCompact && (() => {
        const userBet = getUserBetForEvent(event);
        if (!userBet) return null;

        return (
          <div className="ml-6 mt-2 p-2 bg-black/20 rounded border border-white/10">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/20 border-blue-400/30 text-blue-300 text-xs">
                  Your Bet
                </Badge>
                <span className="text-gray-400">
                  {userBet.outcome} • ${userBet.amount} @ {userBet.odds}
                </span>
                {userBet.powerUpApplied && (
                  <Badge variant="outline" className="bg-yellow-500/20 border-yellow-400/30 text-yellow-300 text-xs">
                    2x
                  </Badge>
                )}
              </div>
              {userBet.resolved && (
                <div className="flex items-center gap-1">
                  {userBet.won ? (
                    <>
                      <TrendingUp size={12} className="text-green-400" />
                      <Badge variant="outline" className="bg-green-500/20 border-green-400/30 text-green-300 text-xs">
                        +${userBet.payout?.toFixed(2)}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={12} className="text-red-400" />
                      <Badge variant="outline" className="bg-red-500/20 border-red-400/30 text-red-300 text-xs">
                        Lost
                      </Badge>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );

  // If simplified mode, render content directly without the nested collapsible
  if (simplified) {
    return (
      <Card className="backdrop-blur-sm bg-card/60 border-border/50 rounded-t-none border-t-0">
        <CardContent className="px-4 py-4">
          <ScrollArea className="h-[300px] pr-4">
            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div className="space-y-3">
                {pastEvents.map((event) => renderEventItem(event, false))}
              </div>
            )}

            {/* Empty State */}
            {pastEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare size={20} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Match events will appear here as the game progresses...</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  // Default mode with full collapsible interface
  return (
    <Card className="backdrop-blur-sm bg-gradient-to-r from-slate-800/40 to-slate-700/40 border-white/10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-white/5 transition-colors rounded-t-lg px-4 py-3">
            <CardTitle className="flex items-center justify-between text-base">
              {isOpen ? (
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-400" />
                  Match Events
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-400 flex-1">
                  {mostRecentEvent ? (
                    <>
                      {getEventIcon(mostRecentEvent.type)}
                      <span>{formatTime(mostRecentEvent.time)}</span>
                      <span className="max-w-[200px] truncate">{mostRecentEvent.description}</span>
                    </>
                  ) : (
                    <span className="text-gray-500">No events yet...</span>
                  )}
                </div>
              )}
              {isOpen ? (
                <ChevronDown size={16} className="text-gray-400" />
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4">
            <ScrollArea className="h-[300px] pr-4">
              {/* Past Events */}
              {pastEvents.length > 0 && (
                <div className="space-y-3">
                  {pastEvents.map((event) => renderEventItem(event, false))}
                </div>
              )}

              {/* Empty State */}
              {pastEvents.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare size={20} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Match events will appear here as the game progresses...</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
