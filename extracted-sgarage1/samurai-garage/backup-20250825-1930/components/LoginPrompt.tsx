import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

interface LoginPromptProps {
  message?: string;
}

export default function LoginPrompt({ message = "この機能を使用するにはログインが必要です" }: LoginPromptProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">ログインが必要です</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            {message}
          </p>
          <Button
            onClick={() => window.location.href = "/api/login"}
            className="w-full"
            data-testid="button-login-prompt"
          >
            <LogIn className="mr-2 h-4 w-4" />
            ログイン
          </Button>
          <Button
            onClick={() => window.location.href = "/"}
            variant="outline"
            className="w-full"
            data-testid="button-back-home"
          >
            ホームに戻る
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}