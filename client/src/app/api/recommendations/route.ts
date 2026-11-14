import { NextResponse } from "next/server";

const BACKEND_URL = (process.env.BACKEND_API_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  "",
);

function forwardResponse(response: Response) {
  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/demo-test`, {
      cache: "no-store",
    });
    return forwardResponse(response);
  } catch {
    return NextResponse.json(
      {
        detail:
          "We couldn’t connect to the job matching service. Make sure the backend is running, then try again.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { detail: "The uploaded form could not be read. Please choose a PDF and try again." },
      { status: 400 },
    );
  }

  if (!(formData.get("file") instanceof File)) {
    return NextResponse.json(
      { detail: "Please choose a PDF resume to continue." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/ai`, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    return forwardResponse(response);
  } catch {
    return NextResponse.json(
      {
        detail:
          "We couldn’t connect to the job matching service. Make sure the backend is running, then try again.",
      },
      { status: 502 },
    );
  }
}
