import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/stores/notificationStore';
import { Clock, UserPlus, UserMinus, MessageSquare, AlertCircle, Loader2, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/services/NotificationService';

interface LeagueNotificationsProps {
  leagueId: string;
}

const LeagueNotifications: React.FC<LeagueNotificationsProps> = ({ leagueId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    notifications,
    unreadCounts,
    loading,
    errors,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    subscribe,
    unsubscribe,
    clearError,
  } = useNotificationStore();

  const leagueNotifications = notifications.get(leagueId) || [];
  const isLoading = loading.get(leagueId) || false;
  const error = errors.get(leagueId);
  const unreadCount = unreadCounts.get(leagueId) || 0;

  useEffect(() => {
    // Authentication check
    if (!user || !leagueId) {
      return;
    }

    // Load notifications
    loadNotifications(leagueId, user.id);

    // Subscribe to real-time updates
    subscribe(leagueId, user.id);

    // Cleanup: unsubscribe when component unmounts or leagueId changes
    return () => {
      unsubscribe(leagueId);
    };
  }, [leagueId, user?.id]);

  const handleMarkAllAsRead = async () => {
    if (!user || !leagueId) return;
    await markAllAsRead(leagueId, user.id);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read_status && user) {
      markAsRead(notification.id, user.id);
    }

    // Route to relevant page based on notification type
    const metadata = notification.metadata || {};
    
    switch (notification.type) {
      case 'ADD':
      case 'DROP':
        // Navigate to free agents or roster page
        navigate(`/roster?league=${leagueId}`);
        break;
      case 'TRADE':
        // Navigate to trades page (if exists)
        navigate(`/roster?league=${leagueId}&tab=trades`);
        break;
      case 'WAIVER':
        // Navigate to waiver wire
        navigate(`/waiver-wire?league=${leagueId}`);
        break;
      case 'CHAT':
        // Navigate to league chat (if exists)
        navigate(`/league/${leagueId}/chat`);
        break;
      default:
        // Default to matchup page
        navigate(`/matchup/${leagueId}`);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ADD':
        return <UserPlus className="w-4 h-4 text-[hsl(var(--vibrant-green))]" />;
      case 'DROP':
        return <UserMinus className="w-4 h-4 text-[hsl(var(--vibrant-orange))]" />;
      case 'WAIVER':
        return <AlertCircle className="w-4 h-4 text-[hsl(var(--vibrant-yellow))]" />;
      case 'CHAT':
        return <MessageSquare className="w-4 h-4 text-[hsl(var(--vibrant-purple))]" />;
      case 'TRADE':
        return <AlertCircle className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: Notification['type'], isRead: boolean) => {
    const baseColors = {
      ADD: 'bg-[hsl(var(--vibrant-green))]/10 border-[hsl(var(--vibrant-green))]/30',
      DROP: 'bg-[hsl(var(--vibrant-orange))]/10 border-[hsl(var(--vibrant-orange))]/30',
      WAIVER: 'bg-[hsl(var(--vibrant-yellow))]/10 border-[hsl(var(--vibrant-yellow))]/30',
      CHAT: 'bg-[hsl(var(--vibrant-purple))]/10 border-[hsl(var(--vibrant-purple))]/30',
      TRADE: 'bg-primary/10 border-primary/30',
      SYSTEM: 'bg-muted/30 border-border/30',
    };

    const color = baseColors[type] || baseColors.SYSTEM;
    const opacity = isRead ? 'opacity-60' : '';
    
    return `${color} ${opacity}`;
  };

  // Authentication check
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-1">Authentication Required</p>
          <p className="text-xs text-muted-foreground">Please sign in to view notifications</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-8 h-8 text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive text-center mb-1">{error}</p>
        <button
          onClick={() => {
            clearError(leagueId);
            if (user) {
              loadNotifications(leagueId, user.id);
            }
          }}
          className="text-xs text-primary hover:underline mt-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-foreground">League Activity</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Real-time updates
          </p>
          {unreadCount > 0 && (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      {/* Notifications List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {leagueNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Clock className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Transactions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {leagueNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${getNotificationColor(notification.type, notification.read_status)}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-medium line-clamp-1 ${notification.read_status ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {notification.title}
                      </p>
                      {!notification.read_status && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 line-clamp-2 ${notification.read_status ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeagueNotifications;
