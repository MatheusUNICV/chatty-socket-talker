
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NamePromptProps {
  onSubmit: (name: string) => void;
}

const NamePrompt: React.FC<NamePromptProps> = ({ onSubmit }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 p-6">
      <div className="text-xl font-semibold mb-2">Como você gostaria de ser chamado?</div>
      <Input
        autoFocus
        value={value}
        maxLength={32}
        placeholder="Digite seu nome"
        onChange={e => setValue(e.target.value)}
        className="max-w-xs"
      />
      <Button type="submit" disabled={!value.trim()}>Entrar no chat</Button>
    </form>
  );
};

export default NamePrompt;
