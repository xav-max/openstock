import { beforeEach, describe, expect, it, vi } from 'vitest';

const createTransportMock = vi.fn();
const verifyMock = vi.fn();
const sendMailMock = vi.fn();

vi.mock('nodemailer', () => ({
    default: {
        createTransport: createTransportMock,
    },
}));

describe('nodemailer lazy initialization', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.resetModules();
        createTransportMock.mockReset();
        verifyMock.mockReset();
        sendMailMock.mockReset();
        verifyMock.mockResolvedValue(true);
        sendMailMock.mockResolvedValue({ messageId: 'msg-123' });
        createTransportMock.mockReturnValue({
            verify: verifyMock,
            sendMail: sendMailMock,
        });
        process.env = {
            ...originalEnv,
            NODEMAILER_EMAIL: 'sender@example.com',
            NODEMAILER_PASSWORD: 'secret',
        };
    });

    it('does not create transporter at import time', async () => {
        await import('@/lib/nodemailer');
        expect(createTransportMock).not.toHaveBeenCalled();
    });

    it('skips verification when SKIP_EMAIL_VERIFICATION is true', async () => {
        process.env.SKIP_EMAIL_VERIFICATION = 'true';
        const { sendWelcomeEmail } = await import('@/lib/nodemailer');

        await sendWelcomeEmail({
            email: 'user@example.com',
            name: 'User',
            intro: 'Welcome',
        });

        expect(createTransportMock).toHaveBeenCalledTimes(1);
        expect(verifyMock).not.toHaveBeenCalled();
        expect(sendMailMock).toHaveBeenCalledTimes(1);
    });
});
