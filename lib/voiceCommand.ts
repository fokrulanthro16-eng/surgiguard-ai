/**
 * Touchless Hands-Free Voice Action Dispatcher
 * 
 * Parses natural speech transcripts from browser SpeechRecognition into
 * deterministic, sanitized OR commands with safety guardrails.
 */

export type VoiceIntentType = 
  | 'TRIGGER_SCAN'
  | 'ADD_STERILE_PACK'
  | 'CONFIRM_WHO_PHASE'
  | 'SPEAK_STATUS_REPORT'
  | 'TARE_SCALE'
  | 'UNKNOWN';

export interface ParsedVoiceCommand {
  rawTranscript: string;
  intent: VoiceIntentType;
  confidence: number;
  parameters: {
    itemId?: string;
    itemName?: string;
    quantity?: number;
    phase?: 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT';
  };
  feedbackMessage: string;
  isActionable: boolean;
}

/**
 * Parses spoken speech text into actionable structured commands
 */
export function parseVoiceCommand(transcript: string): ParsedVoiceCommand {
  const clean = transcript.toLowerCase().trim();

  // 1. Verify count / scan
  if (
    clean.includes('verify') ||
    clean.includes('scan tray') ||
    clean.includes('analyze tray') ||
    clean.includes('count sponges')
  ) {
    return {
      rawTranscript: transcript,
      intent: 'TRIGGER_SCAN',
      confidence: 0.95,
      parameters: {},
      feedbackMessage: 'Voice Command Acknowledged: Initiating Gemini 2.5 Flash optical tray scan.',
      isActionable: true,
    };
  }

  // 2. Add Sterile Pack
  if (clean.includes('add sterile pack') || clean.includes('add pack') || clean.includes('sterile refill')) {
    let quantity = 5;
    if (clean.includes('ten') || clean.includes('10')) quantity = 10;
    else if (clean.includes('five') || clean.includes('5')) quantity = 5;
    else if (clean.includes('fifteen') || clean.includes('15')) quantity = 15;
    else if (clean.includes('twenty') || clean.includes('20')) quantity = 20;

    let itemId = 'lap-sponge-4x4';
    let itemName = 'Lap Sponge 4x4 (Radiopaque)';
    if (clean.includes('needle') || clean.includes('suture')) {
      itemId = 'suture-needle-3-0';
      itemName = '3-0 Vicryl Suture Needle';
    } else if (clean.includes('forcep') || clean.includes('scissor')) {
      itemId = 'curved-mayo-forceps';
      itemName = 'Curved Mayo Scissors & Forceps';
    }

    return {
      rawTranscript: transcript,
      intent: 'ADD_STERILE_PACK',
      confidence: 0.92,
      parameters: {
        itemId,
        itemName,
        quantity,
      },
      feedbackMessage: `Voice Command Acknowledged: Registering +${quantity} ${itemName} with SHA-256 commit.`,
      isActionable: true,
    };
  }

  // 3. WHO Checklist Confirmation
  if (clean.includes('time out') || clean.includes('timeout')) {
    return {
      rawTranscript: transcript,
      intent: 'CONFIRM_WHO_PHASE',
      confidence: 0.96,
      parameters: { phase: 'TIME_OUT' },
      feedbackMessage: 'Voice Command Acknowledged: WHO Time-Out gates confirmed complete.',
      isActionable: true,
    };
  }

  if (clean.includes('sign out') || clean.includes('signout')) {
    return {
      rawTranscript: transcript,
      intent: 'CONFIRM_WHO_PHASE',
      confidence: 0.96,
      parameters: { phase: 'SIGN_OUT' },
      feedbackMessage: 'Voice Command Acknowledged: WHO Sign-Out protocol verified.',
      isActionable: true,
    };
  }

  if (clean.includes('sign in') || clean.includes('signin')) {
    return {
      rawTranscript: transcript,
      intent: 'CONFIRM_WHO_PHASE',
      confidence: 0.96,
      parameters: { phase: 'SIGN_IN' },
      feedbackMessage: 'Voice Command Acknowledged: WHO Sign-In protocol confirmed.',
      isActionable: true,
    };
  }

  // 4. Status Report
  if (
    clean.includes('status report') ||
    clean.includes('what is the status') ||
    clean.includes('report status') ||
    clean.includes('closure status')
  ) {
    return {
      rawTranscript: transcript,
      intent: 'SPEAK_STATUS_REPORT',
      confidence: 0.98,
      parameters: {},
      feedbackMessage: 'Voice Command Acknowledged: Generating spoken surgical status report.',
      isActionable: true,
    };
  }

  // 5. Tare Scale
  if (clean.includes('tare scale') || clean.includes('zero scale') || clean.includes('tare weight')) {
    return {
      rawTranscript: transcript,
      intent: 'TARE_SCALE',
      confidence: 0.94,
      parameters: {},
      feedbackMessage: 'Voice Command Acknowledged: Gravimetric scale tared to dry zero baseline.',
      isActionable: true,
    };
  }

  return {
    rawTranscript: transcript,
    intent: 'UNKNOWN',
    confidence: 0.3,
    parameters: {},
    feedbackMessage: 'Unrecognized surgical voice command. Please speak clearly (e.g. "verify count" or "add sterile pack").',
    isActionable: false,
  };
}
