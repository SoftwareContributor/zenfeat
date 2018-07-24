package com.getcapacitor.plugin.notification;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.support.annotation.Nullable;
import android.support.v4.app.NotificationCompat;
import android.support.v4.app.NotificationManagerCompat;
import android.support.v4.app.RemoteInput;
import android.util.Log;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Date;
import java.util.List;

/**
 * Contains implementations for all notification actions
 */
public class LocalNotificationManager {

  // Action constants
  public static final String NOTIFICATION_INTENT_KEY = "notificationId";
  public static final String ACTION_INTENT_KEY = "NotificationUserAction";
  public static final String REMOTE_INPUT_KEY = "NotificationInput";
  public static final String EXTRAS_INTENT_KEY = "NotificationExtras";

  public static final String DEFAULT_NOTIFICATION_CHANNEL_ID = "default";

  private Context context;
  private Activity activity;
  private NotificationStorage storage;

  public LocalNotificationManager(NotificationStorage notificationStorage, Activity activity) {
    storage = notificationStorage;
    this.activity = activity;
    this.context = activity;
  }

  /**
   * Method extecuted when notification is launched by user from the notification bar.
   */
  public JSObject handleNotificationActionPerformed(Intent data, NotificationStorage notificationStorage) {
    Log.d(Bridge.TAG, "LocalNotification received: " + data.getDataString());
    int notificationId = data.getIntExtra(LocalNotificationManager.NOTIFICATION_INTENT_KEY, Integer.MIN_VALUE);
    if (notificationId == Integer.MIN_VALUE) {
      Log.d("LocalNotification", "Activity started without notification attached");
      return null;
    }
    notificationStorage.deleteNotification(Integer.toString(notificationId));
    JSObject dataJson = new JSObject();
    dataJson.put("notificationRequest", data.getExtras());
    String input = data.getStringExtra(LocalNotificationManager.REMOTE_INPUT_KEY);
    if (input != null) {
      dataJson.put("inputValue", input);
    }
    String menuAction = data.getStringExtra(LocalNotificationManager.ACTION_INTENT_KEY);
    dataJson.put("actionId", menuAction);
    LocalNotification notification = new LocalNotification();
    notification.setId(notificationId);
    String extraJson = data.getStringExtra(LocalNotificationManager.EXTRAS_INTENT_KEY);
    if (extraJson != null) {
      notification.setExtraFromString(extraJson);
    }
    dataJson.put("notificationRequest", notification);
    return dataJson;
  }

  /**
   * Create notification channel
   */
  public void createNotificationChannel() {
    // TODO allow to create multiple channels
    // Create the NotificationChannel, but only on API 26+ because
    // the NotificationChannel class is new and not in the support library
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      CharSequence name = "Default";
      String description = "Default";
      int importance = android.app.NotificationManager.IMPORTANCE_DEFAULT;
      NotificationChannel channel = new NotificationChannel(DEFAULT_NOTIFICATION_CHANNEL_ID, name, importance);
      channel.setDescription(description);
      // Register the channel with the system; you can't change the importance
      // or other notification behaviors after this
      android.app.NotificationManager notificationManager = context.getSystemService(android.app.NotificationManager.class);
      notificationManager.createNotificationChannel(channel);
    }
  }

  @Nullable
  public JSONArray schedule(PluginCall call, List<LocalNotification> localNotifications) {
    JSONArray ids = new JSONArray();
    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);

    boolean notificationsEnabled = notificationManager.areNotificationsEnabled();
    if (!notificationsEnabled) {
      call.error("Notifications not enabled on this device");
      return null;
    }
    for (LocalNotification localNotification : localNotifications) {
      Integer id = localNotification.getId();
      if (localNotification.getId() == null) {
        call.error("LocalNotification missing identifier");
        return null;
      }
      dismissVisibleNotification(call, id);
      cancelTimerForNotification(id);
      buildNotification(notificationManager, localNotification, call);
      ids.put(id);
    }
    return ids;
  }

  // TODO Progressbar support
  // TODO System categories (DO_NOT_DISTURB etc.)
  // TODO control visibility by flag Notification.VISIBILITY_PRIVATE
  // TODO Group notifications (setGroup, setGroupSummary, setNumber)
  // TODO use NotificationCompat.MessagingStyle for latest API
  // TODO expandable notification NotificationCompat.MessagingStyle
  // TODO media style notification support NotificationCompat.MediaStyle
  // TODO custom small/large icons
  private void buildNotification(NotificationManagerCompat notificationManager, LocalNotification localNotification, PluginCall call) {
    NotificationCompat.Builder mBuilder = new NotificationCompat.Builder(this.context, DEFAULT_NOTIFICATION_CHANNEL_ID)
            .setContentTitle(localNotification.getTitle())
            .setContentText(localNotification.getBody())
            .setAutoCancel(true)
            .setOngoing(false)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setDefaults(Notification.DEFAULT_SOUND | Notification.DEFAULT_VIBRATE | Notification.DEFAULT_LIGHTS);

    String sound = localNotification.getSound();
    if (sound != null) {
      Uri soundUri = Uri.parse(sound);
      // Grant permission to use sound
      context.grantUriPermission(
              "com.android.systemui", soundUri,
              Intent.FLAG_GRANT_READ_URI_PERMISSION);
      mBuilder.setSound(soundUri);
    }

    mBuilder.setVisibility(Notification.VISIBILITY_PRIVATE);
    mBuilder.setOnlyAlertOnce(true);

    mBuilder.setSmallIcon(localNotification.getSmallIcon(context));
    createActionIntents(localNotification, mBuilder);
    // notificationId is a unique int for each localNotification that you must define
    Notification buildNotification = mBuilder.build();
    if (localNotification.isScheduled()) {
      triggerScheduledNotification(buildNotification, localNotification);
    } else {
      notificationManager.notify(localNotification.getId(), buildNotification);
    }
  }

  // Create intents for open/dissmis actions
  private void createActionIntents(LocalNotification localNotification, NotificationCompat.Builder mBuilder) {
    // Open intent
    Intent intent = new Intent(context, activity.getClass());
    intent.setAction(Intent.ACTION_MAIN);
    intent.addCategory(Intent.CATEGORY_LAUNCHER);
    intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    JSONObject extra = localNotification.getExtra();
    intent.putExtra(NOTIFICATION_INTENT_KEY, localNotification.getId());
    intent.putExtra(ACTION_INTENT_KEY, "tap");
    if (extra != null) {
      intent.putExtra(EXTRAS_INTENT_KEY, extra.toString());
    }

    PendingIntent pendingIntent = PendingIntent.getActivity(context, localNotification.getId(), intent, PendingIntent.FLAG_CANCEL_CURRENT);
    mBuilder.setContentIntent(pendingIntent);

    // Build action types
    String actionTypeId = localNotification.getActionTypeId();
    if (actionTypeId != null) {
      NotificationAction[] actionGroup = storage.getActionGroup(actionTypeId);
      for (int i = 0; i < actionGroup.length; i++) {
        NotificationAction notificationAction = actionGroup[i];
        // TODO Add custom icons to actions
        // TODO build separate pending intents for actions
        NotificationCompat.Action.Builder actionBuilder = new NotificationCompat.Action.Builder(0, notificationAction.getTitle(), pendingIntent);
        Intent actionIntent = new Intent(intent);
        actionIntent.putExtra(ACTION_INTENT_KEY, notificationAction.getId());
        if (notificationAction.isInput()) {
          RemoteInput remoteInput = new RemoteInput.Builder(REMOTE_INPUT_KEY)
                  .setLabel(notificationAction.getTitle())
                  .build();
          actionBuilder.addRemoteInput(remoteInput);
        }
        mBuilder.addAction(actionBuilder.build());
      }
    }

    // Dismiss intent
    Intent dissmissIntent = new Intent(context, NotificationDismissReceiver.class);
    dissmissIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
    dissmissIntent.putExtra(NOTIFICATION_INTENT_KEY, localNotification.getId());
    dissmissIntent.putExtra(ACTION_INTENT_KEY, "dismiss");
    PendingIntent deleteIntent = PendingIntent.getBroadcast(
            context, localNotification.getId(), dissmissIntent, 0);
    mBuilder.setDeleteIntent(deleteIntent);
  }

  /**
   * Build a notification trigger, such as triggering each N seconds, or
   * on a certain date "shape" (such as every first of the month)
   */
  // TODO support different AlarmManager.RTC modes depending on priority
  // TODO restore alarm on device shutdown (requires persistence)
  private void triggerScheduledNotification(Notification notification, LocalNotification request) {
    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    LocalNotificationSchedule schedule = request.getSchedule();
    Intent notificationIntent = new Intent(context, TimedNotificationPublisher.class);
    notificationIntent.putExtra(NOTIFICATION_INTENT_KEY, request.getId());
    notificationIntent.putExtra(TimedNotificationPublisher.NOTIFICATION_KEY, notification);
    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, request.getId(), notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);

    // Schedule at specific time (with repeating support)
    Date at = schedule.getAt();
    if (at != null) {
      if (at.getTime() < new Date().getTime()) {
        Log.e(Bridge.TAG, "Scheduled time must be *after* current time");
        return;
      }
      if (schedule.isRepeating()) {
        long interval = at.getTime() - new Date().getTime();
        alarmManager.setRepeating(AlarmManager.RTC, at.getTime(), interval, pendingIntent);
      } else {
        alarmManager.setExact(AlarmManager.RTC, at.getTime(), pendingIntent);
      }
      return;
    }

    // Schedule at specific intervals
    String every = schedule.getEvery();
    if (every != null) {
      Long everyInterval = schedule.getEveryInterval();
      if (everyInterval != null) {
        long startTime = new Date().getTime() + everyInterval;
        alarmManager.setRepeating(AlarmManager.RTC, startTime, everyInterval, pendingIntent);
      }
      return;
    }

    // Cron like scheduler
    DateMatch on = schedule.getOn();
    if (on != null) {
      notificationIntent.putExtra(TimedNotificationPublisher.CRON_KEY, on.toMatchString());
      pendingIntent = PendingIntent.getBroadcast(context, request.getId(), notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);
      alarmManager.setExact(AlarmManager.RTC, on.nextTrigger(new Date()), pendingIntent);
    }
  }

  public void cancel(PluginCall call) {
    List<Integer> notificationsToCancel = LocalNotification.getLocalNotificationPendingList(call);
    if (notificationsToCancel != null) {
      for (Integer id : notificationsToCancel) {
        dismissVisibleNotification(call, id);
        cancelTimerForNotification(id);
        storage.deleteNotification(Integer.toString(id));
      }
    }
    call.success();
  }

  private void cancelTimerForNotification(Integer notificationId) {
    Intent intent = new Intent(context, TimedNotificationPublisher.class);
    PendingIntent pi = PendingIntent.getBroadcast(
            context, notificationId, intent, 0);
    if (pi != null) {
      AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
      alarmManager.cancel(pi);
    }
  }

  private void dismissVisibleNotification(PluginCall call, int notificationId) {
    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this.context);
    notificationManager.cancel(notificationId);
  }
}
