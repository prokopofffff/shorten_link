import type { AllLinksResponse, AnalyticsInfo, LinkInfo, ShortenUrlRequest, ShortenUrlResponse } from '@url-shortener/shared-types';
import express from 'express';
import { PrismaClient } from '../generated/client';

const main = async () => {
    const { nanoid } = await import('nanoid');
    const app = express();
    const prisma = new PrismaClient();
    const port = process.env.PORT || 3001;
    const appUrl = process.env.APP_URL || `http://localhost:${port}`;

    app.use(express.json());

    app.post('/shorten', async (req, res) => {
        const { originalUrl, expiresAt, alias } = req.body as ShortenUrlRequest;

        if (!originalUrl) {
            return res.status(400).json({ error: 'originalUrl is required' });
        }

        try {
            if (alias) {
                if (alias.length > 20) {
                    return res.status(400).json({ error: 'Alias max length is 20 characters' });
                }
                const existingLink = await prisma.link.findUnique({ where: { alias } });
                if (existingLink) {
                    return res.status(409).json({ error: 'Alias already in use' });
                }
            }

            const shortId = alias || nanoid(8);

            const newLink = await prisma.link.create({
                data: {
                    originalUrl,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    alias: alias,
                    shortId: shortId,
                },
            });

            const response: ShortenUrlResponse = {
                id: newLink.id,
                shortUrl: `${appUrl}/${shortId}`,
            };
            res.status(201).json(response);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/all-links', async (req, res) => {
        try {
            const links = await prisma.link.findMany({
                include: {
                    clicks: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        select: { ipAddress: true }
                    }
                }
            });

            const response: AllLinksResponse[] = links.map(link => ({
                id: link.id,
                originalUrl: link.originalUrl,
                shortUrl: `${appUrl}/${link.shortId}`,
                shortId: link.shortId,
                createdAt: link.createdAt.toISOString(),
                clickCount: link.clickCount,
                lastFiveIps: link.clicks.map(c => c.ipAddress)
            }));

            res.json(response);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/:shortUrl', async (req, res) => {
        const { shortUrl } = req.params;
        try {
            const link = await prisma.link.findFirst({
                where: {
                    OR: [
                        { shortId: shortUrl },
                        { alias: shortUrl }
                    ]
                }
            });
            if (!link) {
                return res.status(404).json({ error: 'Link not found' });
            }
            if (link.expiresAt && new Date() > link.expiresAt) {
                return res.status(410).json({ error: 'Link expired' });
            }
            await prisma.link.update({
                where: { id: link.id },
                data: { clickCount: { increment: 1 } },
            }),
            await prisma.click.create({
              data: {
                  linkId: link.id,
                  ipAddress: req.ip ?? 'unknown',
              },
            }),
            await prisma.$transaction([


            ]);
            res.redirect(301, link.originalUrl);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/info/:shortUrl', async (req, res) => {
        const { shortUrl } = req.params;
        console.log('GET /info/:shortUrl - Request params:', req.params);
        try {
            const link = await prisma.link.findFirst({
                where: {
                    OR: [
                        { shortId: shortUrl },
                        { alias: shortUrl }
                    ]
                }
            });

            if (!link) {
                return res.status(404).json({ error: 'Link not found' });
            }

            const response: LinkInfo = {
                originalUrl: link.originalUrl,
                createdAt: link.createdAt.toISOString(),
                clickCount: link.clickCount,
            };
            res.json(response);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/delete/:shortUrl', async (req, res) => {
        const { shortUrl } = req.params;
        console.log('DELETE /delete/:shortUrl - Request params:', req.params);
        try {
            const link = await prisma.link.findFirst({
                where: {
                    OR: [
                        { shortId: shortUrl },
                        { alias: shortUrl }
                    ]
                }
            });

            if (!link) {
                return res.status(404).json({ error: 'Link not found' });
            }

            await prisma.link.delete({ where: { id: link.id } });
            res.status(204).send();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/analytics/:shortUrl', async (req, res) => {
        const { shortUrl } = req.params;
        console.log('GET /analytics/:shortUrl - Request params:', req.params);
        try {
            const link = await prisma.link.findFirst({
                where: {
                    OR: [
                        { shortId: shortUrl },
                        { alias: shortUrl }
                    ]
                },
                include: {
                    clicks: {
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                        select: { ipAddress: true }
                    }
                }
            });

            if (!link) {
                return res.status(404).json({ error: 'Link not found' });
            }

            const response: AnalyticsInfo = {
                clickCount: link.clickCount,
                lastFiveIps: link.clicks.map(c => c.ipAddress),
            };
            res.json(response);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.listen(port, () => {
        console.log(`Backend server is running on http://localhost:${port}`);
    });
};

main().catch(console.error);
