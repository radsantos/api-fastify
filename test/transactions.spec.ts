import { expect, test, beforeAll, afterAll, describe, it, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Transactions routes', () => {
    beforeAll(async () => {
        await app.ready()
    })

    afterAll(async () => {
        await app.close()
    })

    beforeEach(async () => {
        execSync('npm run knex migrate:rollback --all')
        execSync('npm run knex migrate:latest')
    })


    test('o usuário consegue criar uma nova transação', async () => {

        const response = await request(app.server)
            .post('/transactions')
            .send({
                title: 'Transação de teste',
                amount: 5000,
                type: 'credit',
            })
        expect(201)
    })

    it('should be able to list all transactions', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'Transação de teste',
                amount: 5000,
                type: 'credit',
            })
        const cookies = createTransactionResponse.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies ?? [])
            .expect(200)

        expect(listTransactionsResponse.body.transactions).toEqual([
            expect.objectContaining({
                title: 'Transação de teste',
                amount: 5000,
            })
        ])
    })

    it('should be able to get a specific transactions', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'Transação de teste',
                amount: 5000,
                type: 'credit',
            })
        const cookies = createTransactionResponse.get('Set-Cookie')

        const listTransactionsResponse = await request(app.server)
            .get('/transactions')
            .set('Cookie', cookies ?? [])
            .expect(200)

        const transactionId = listTransactionsResponse.body.transactions[0].id
        const getTransactionResponse = await request(app.server)
            .get(`/transactions/${transactionId}`)
            .set('Cookie', cookies ?? [])
            .expect(200)

        expect(getTransactionResponse.body.transaction).toEqual(
            expect.objectContaining({
                title: 'Transação de teste',
                amount: 5000,
            })
        )
    })

    it('should be able to get the summary', async () => {
        const createTransactionResponse = await request(app.server)
            .post('/transactions')
            .send({
                title: 'Credit transaction',
                amount: 5000,
                type: 'credit',
            })
        const cookies = createTransactionResponse.get('Set-Cookie')

        await request(app.server)
            .post('/transactions')
            .set('Cookie', cookies ?? [])
            .send({
                title: 'Debit transaction',
                amount: 2000,
                type: 'Debit',
            })

        const summaryResponse = await request(app.server)
            .get('/transactions/summary')
            .set('Cookie', cookies ?? [])
            .expect(200)

        expect(summaryResponse.body.summary).toEqual({
            amount: 3000,
        })
    })


})      
