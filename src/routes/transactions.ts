import { FastifyInstance } from "fastify"
import { z } from "zod"
import { db } from "../database"
import crypto from 'node:crypto'
import { checkSessionIdExist } from "../middleware/check-session-id-exist"
import { request } from "node:http"

export async function transactionsRoutes(app: FastifyInstance): Promise<void> {
    

    app.get('/',
        {
            preHandler:[checkSessionIdExist],
        },
        async (request, reply) => {

            const { sessionId } = request.cookies

            const transactions = await db('transactions')
            .where('session_id', sessionId)
            .select('*')
        
            return { transactions }
    }
    )

    app.get('/:id',{preHandler:[checkSessionIdExist]}, async (request) => {
        const getTransactionParamsSchema = z.object({
            id: z.string().uuid(),
        })

        const { id } = getTransactionParamsSchema.parse(request.params)

        const { sessionId } = request.cookies

        const transaction = await db('transactions')
        .where(
            {
                session_id: sessionId,
                id: id,
            })
            .first()

        return { transaction }
    })

    app.get('/summary',{preHandler:[checkSessionIdExist]}, async (request) => {
        const { sessionId } = request.cookies

        const summary = await db('transactions')
        .where('session_id', sessionId)
            .sum('amount', { as: 'amount' })
            .first()

        return { summary }
    });

    app.post('/', async (request, reply) => {

        const createTransactionBody = z.object({
            title: z.string(),
            amount: z.number(),
            type: z.enum(['credit', 'debit']),
            
        })

        const {title, amount, type} = createTransactionBody.parse(request.body)

        let sessionId = request.cookies.sessionId
    if (!sessionId) {
        sessionId = crypto.randomUUID()
        reply.cookie('sessionId', sessionId, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        })
    }

    await db('transactions').insert({
        id: crypto.randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,  
        session_id: sessionId,
    })

    return reply.status(201).send()
})

}