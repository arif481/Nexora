import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { generateGeminiResponse } from '@/lib/services/gemini';
import type { EventCategory } from '@/types';

interface SmartEventInputProps {
    onEventParsed: (eventData: {
        title: string;
        description: string;
        date: string; // YYYY-MM-DD
        startTime: string; // HH:mm
        endTime: string; // HH:mm
        allDay: boolean;
        location: string;
        category: EventCategory;
    }) => void;
}

export function SmartEventInput({ onEventParsed }: SmartEventInputProps) {
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleParse = async () => {
        if (!query.trim()) return;
        setIsProcessing(true);

        try {
            const now = new Date();
            const prompt = `Convert the following natural language request into a calendar event.
Current Date/Time context: ${now.toString()}

Request: "${query}"

Return ONLY a raw JSON object with no markdown formatting or extra text. Use this exact schema:
{
  "title": string (the event name),
  "description": string (any extra details, or empty string),
  "date": string (YYYY-MM-DD format of the event date. If not specified, use today),
  "startTime": string (HH:mm format 24-hour time. If not specified, use "09:00"),
  "endTime": string (HH:mm format 24-hour time. Default to 1 hour after start if not specified),
  "allDay": boolean,
  "location": string,
  "category": "work" | "personal" | "health" | "social" | "learning" | "rest" | "other" (pick best fit)
}`;

            const response = await generateGeminiResponse(prompt);
            const jsonStr = response.content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
            const parsed = JSON.parse(jsonStr);

            onEventParsed({
                title: parsed.title || 'New Event',
                description: parsed.description || '',
                date: parsed.date || now.toISOString().split('T')[0],
                startTime: parsed.startTime || '09:00',
                endTime: parsed.endTime || '10:00',
                allDay: Boolean(parsed.allDay),
                location: parsed.location || '',
                category: parsed.category || 'work',
            });
            setQuery('');
        } catch (err) {
            console.error('Failed to parse event via AI:', err);
            // Fallback
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Card variant="glass" className="p-1 mb-6 mt-2 relative overflow-hidden group border-neon-purple/30">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-neon-cyan/5 opacity-50 pointer-events-none" />
            <div className="relative flex items-center">
                <div className="pl-4 pr-2">
                    <Sparkles className="w-5 h-5 text-neon-purple" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleParse();
                    }}
                    placeholder="Type 'Team meeting tomorrow 3pm' and press enter..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-dark-400 py-3 text-sm focus:ring-0"
                />
                <div className="pr-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleParse}
                        disabled={!query.trim() || isProcessing}
                        className="text-neon-cyan hover:bg-neon-cyan/10"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
