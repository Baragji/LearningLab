// packages/ui/components/Notification/NotificationProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Notification, NotificationType } from "./Notification";

export type NotificationPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  position?: NotificationPosition;
}

export interface ShowNotificationOptions {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  position?: NotificationPosition;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  showNotification: (opts: ShowNotificationOptions) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  success: (
    title: string,
    message?: string,
    opts?: Partial<Omit<ShowNotificationOptions, "type" | "title" | "message">>,
  ) => string;
  error: (
    title: string,
    message?: string,
    opts?: Partial<Omit<ShowNotificationOptions, "type" | "title" | "message">>,
  ) => string;
  warning: (
    title: string,
    message?: string,
    opts?: Partial<Omit<ShowNotificationOptions, "type" | "title" | "message">>,
  ) => string;
  info: (
    title: string,
    message?: string,
    opts?: Partial<Omit<ShowNotificationOptions, "type" | "title" | "message">>,
  ) => string;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  showNotification: () => "",
  hideNotification: () => {},
  clearAllNotifications: () => {},
  success: () => "",
  error: () => "",
  warning: () => "",
  info: () => "",
});

export const useNotification = () => useContext(NotificationContext);

export interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultPosition?: NotificationPosition;
  defaultDuration?: number;
}

class NotificationManager {
  constructor(
    private setNotifications: React.Dispatch<
      React.SetStateAction<NotificationItem[]>
    >,
    private readonly maxNotifications: number,
    private readonly defaultPosition: NotificationPosition,
    private readonly defaultDuration: number,
  ) {}

  private generateNotificationId = () =>
    `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  add = (options: ShowNotificationOptions) => {
    const id = this.generateNotificationId();
    const notification: NotificationItem = {
      id,
      type: options.type,
      title: options.title,
      message: options.message,
      duration: options.duration ?? this.defaultDuration,
      position: options.position ?? this.defaultPosition,
    };

    this.setNotifications((current) => {
      // Hvis vi har nået max antal notifikationer, fjern den ældste
      const trimmed =
        current.length >= this.maxNotifications ? current.slice(1) : current;
      return [...trimmed, notification];
    });

    return id;
  };

  remove = (id: string) => {
    this.setNotifications((current) => current.filter((n) => n.id !== id));
  };

  removeAll = () => {
    this.setNotifications([]);
  };

  createTypedNotification =
    (type: NotificationType) =>
    (
      title: string,
      message?: string,
      opts?: Partial<
        Omit<ShowNotificationOptions, "type" | "title" | "message">
      >,
    ) =>
      this.add({ type, title, message, ...opts });
}

export function NotificationProvider({
  children,
  maxNotifications = 5,
  defaultPosition = "top-right",
  defaultDuration = 5000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const manager = new NotificationManager(
    setNotifications,
    maxNotifications,
    defaultPosition,
    defaultDuration,
  );

  // Gruppér notifikationer efter position
  const grouped = notifications.reduce<
    Record<NotificationPosition, NotificationItem[]>
  >(
    (acc, n) => {
      const pos = n.position || defaultPosition;
      acc[pos] = acc[pos] || [];
      acc[pos].push(n);
      return acc;
    },
    {} as Record<NotificationPosition, NotificationItem[]>,
  );

  // Bestem CSS klasser baseret på position
  const classesFor = (pos: NotificationPosition): string =>
    ({
      "top-right": "top-4 right-4 items-end",
      "top-left": "top-4 left-4 items-start",
      "bottom-right": "bottom-4 right-4 items-end",
      "bottom-left": "bottom-4 left-4 items-start",
      "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
      "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
    })[pos] || "top-4 right-4 items-end";

  const entries = Object.entries(grouped) as [
    NotificationPosition,
    NotificationItem[],
  ][];

  const value: NotificationContextValue = {
    notifications,
    showNotification: manager.add,
    hideNotification: manager.remove,
    clearAllNotifications: manager.removeAll,
    success: manager.createTypedNotification("success"),
    error: manager.createTypedNotification("error"),
    warning: manager.createTypedNotification("warning"),
    info: manager.createTypedNotification("info"),
  };

  return (
    <>
      <NotificationContext.Provider value={value}>
        {children}
      </NotificationContext.Provider>

      {/* Render notifikationer grupperet efter position */}
      {entries.map(([pos, items]) => (
        <div
          key={pos}
          className={`fixed z-50 flex flex-col space-y-4 w-full max-w-sm ${classesFor(
            pos,
          )}`}
        >
          {items.map((item: NotificationItem) => (
            <Notification
              key={item.id}
              {...item}
              isVisible={true}
              onDismiss={() => manager.remove(item.id)}
              position={pos}
            />
          ))}
        </div>
      ))}
    </>
  );
}
