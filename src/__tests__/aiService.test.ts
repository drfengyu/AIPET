import { getAIResponse, getAvailableEmotions, getExpressionForEmotion, type ChatMessage } from '../renderer/services/aiService';

describe('aiService', () => {
  describe('getAIResponse (mock mode)', () => {
    it('returns mock response when useMock is true', async () => {
      const result = await getAIResponse('你好', [], true);
      expect(result.text).toBeTruthy();
      expect(result.emotion).toBeDefined();
    });

    it('greets on hello-like messages', async () => {
      const result = await getAIResponse('你好！', [], true);
      expect(result.text).toContain('你好');
      expect(result.emotion).toBe('happy');
    });

    it('detects love-themed messages', async () => {
      const result = await getAIResponse('我喜欢你', [], true);
      expect(result.emotion).toBe('blush');
    });

    it('tells joke on joke request', async () => {
      const result = await getAIResponse('讲个笑话', [], true);
      expect(result.text).toContain('程序员');
      expect(result.emotion).toBe('happy');
    });

    it('says goodbye on farewell', async () => {
      const result = await getAIResponse('再见', [], true);
      expect(result.text).toContain('再见');
      expect(result.emotion).toBe('happy');
    });

    it('returns default response for unknown input', async () => {
      const result = await getAIResponse('xyzzy_unknown_test', [], true);
      expect(result.text).toBeTruthy();
      expect(result.emotion).toBe('neutral');
    });

    it('handles empty message gracefully', async () => {
      const result = await getAIResponse('', [], true);
      expect(result.text).toBeTruthy();
    });

    it('accepts chat history for context', async () => {
      const history: ChatMessage[] = [
        { role: 'user', content: '我的名字是小明' },
        { role: 'assistant', content: '你好小明！' },
      ];
      const result = await getAIResponse('你还记得我的名字吗', history, true);
      expect(result.text).toBeTruthy();
    });
  });

  describe('getAvailableEmotions', () => {
    it('returns all 6 emotions', () => {
      const emotions = getAvailableEmotions();
      expect(emotions).toHaveLength(6);
      expect(emotions).toContain('neutral');
      expect(emotions).toContain('happy');
      expect(emotions).toContain('sad');
      expect(emotions).toContain('angry');
      expect(emotions).toContain('surprised');
      expect(emotions).toContain('blush');
    });
  });

  describe('getExpressionForEmotion', () => {
    it('maps neutral to F01', () => {
      expect(getExpressionForEmotion('neutral')).toBe('F01');
    });

    it('maps happy to F02', () => {
      expect(getExpressionForEmotion('happy')).toBe('F02');
    });

    it('maps sad to F03', () => {
      expect(getExpressionForEmotion('sad')).toBe('F03');
    });

    it('maps angry to F04', () => {
      expect(getExpressionForEmotion('angry')).toBe('F04');
    });

    it('maps surprised to F05', () => {
      expect(getExpressionForEmotion('surprised')).toBe('F05');
    });

    it('maps blush to F06', () => {
      expect(getExpressionForEmotion('blush')).toBe('F06');
    });

    it('defaults to F01 for unknown emotions', () => {
      expect(getExpressionForEmotion('unknown')).toBe('F01');
    });
  });
});
