import { sendFrameNotification } from "@/lib/notification-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fid, notification } = body;

    console.log("[API] POST /api/notify", {
      timestamp: new Date().toISOString(),
      fid,
      notificationTitle: notification?.title,
    });

    const result = await sendFrameNotification({
      fid,
      title: notification.title,
      body: notification.body,
      notificationDetails: notification.notificationDetails,
    });

    if (result.state === "error") {
      console.log("[API] POST /api/notify - Error", {
        fid,
        error: result.error,
      });
      return NextResponse.json(
        { error: result.error },
        { status: 500 },
      );
    }

    console.log("[API] POST /api/notify - Success", { fid });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
