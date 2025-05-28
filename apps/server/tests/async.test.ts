// ============================================================================
// SUPPORTING TYPES AND CLASSES
// ============================================================================

interface User {
    id: number;
    name: string;
    email: string;
}

interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}

class NetworkError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

class TimeoutError extends Error {
    constructor(message: string = 'Operation timed out') {
        super(message);
        this.name = 'TimeoutError';
    }
}

// Mock API service for testing
class MockApiService {
    static async fetchUser(id: number, delay: number = 100): Promise<User> {
        await this.delay(delay);
        if (id <= 0) throw new NetworkError(400, 'Invalid user ID');
        return { id, name: `User${id}`, email: `user${id}@example.com` };
    }

    static async fetchUsers(ids: number[]): Promise<User[]> {
        const promises = ids.map(id => this.fetchUser(id));
        return Promise.all(promises);
    }

    static async unreliableOperation(successRate: number = 0.7): Promise<string> {
        await this.delay(50);
        if (Math.random() > successRate) {
            throw new NetworkError(500, 'Service temporarily unavailable');
        }
        return 'Success!';
    }

    public static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('TypeScript Async/Await Interview Problems', () => {

    // Problem 1: Basic async/await with error handling
    describe('Problem 1: Basic Async Operations', () => {

        it('should_fetch_user_successfully_with_proper_typing', async () => {
            // TODO: Implement a function that fetches a user by ID
            // Requirements:
            // - Use async/await syntax
            // - Return type should be Promise<User>
            // - Handle the case where user ID is valid (> 0)

            const fetchUserById = async (id: number): Promise<User> => {
                // Your implementation here
                return await MockApiService.fetchUser(id);
            };

            const user = await fetchUserById(1);
            expect(user.id).toBe(1);
            expect(user.name).toBe('User1');
        });

        it('should_handle_api_errors_gracefully', async () => {
            // TODO: Implement error handling for the fetchUserById function
            // Requirements:
            // - Catch NetworkError specifically
            // - Return null for invalid IDs instead of throwing
            // - Re-throw any other unexpected errors

            const safeFetchUser = async (id: number): Promise<User | null> => {
                // Your implementation here
                try {
                    return await MockApiService.fetchUser(id);
                } catch (e) {
                    return null;
                }
            };

            const result = await safeFetchUser(-1);
            expect(result).toBeNull();
        });
    });

    // Problem 2: Concurrent operations with Promise.all vs sequential
    describe('Problem 2: Concurrent vs Sequential Execution', () => {

        it('should_fetch_multiple_users_concurrently', async () => {
            // TODO: Implement concurrent fetching of multiple users
            // Requirements:
            // - Fetch users with IDs [1, 2, 3] concurrently
            // - Measure execution time (should be ~100ms, not ~300ms)
            // - Return array of users in the same order as input IDs

            const fetchUsersConcurrently = async (ids: number[]): Promise<User[]> => {
                // Your implementation here
                const proms: Promise<User>[] = [];
                for (const id of ids) {
                    proms.push(MockApiService.fetchUser(id));
                };
                return await Promise.all(proms);
            };

            const startTime = Date.now();
            const users = await fetchUsersConcurrently([1, 2, 3]);
            const executionTime = Date.now() - startTime;

            expect(users).toHaveLength(3);
            expect(executionTime).toBeLessThan(200); // Should be concurrent, not sequential
        });

        it('should_demonstrate_sequential_vs_concurrent_performance', async () => {
            // TODO: Implement both sequential and concurrent versions
            // Requirements:
            // - Sequential: await each fetch one by one
            // - Concurrent: use Promise.all for parallel execution
            // - Both should return the same data structure

            const fetchUsersSequentially = async (ids: number[]): Promise<User[]> => {
                // Your implementation here
                const users: User[] = [];
                for (const id of ids) {
                    users.push(await MockApiService.fetchUser(id));
                };
                return users;
            };

            const fetchUsersConcurrently = async (ids: number[]): Promise<User[]> => {
                // Your implementation here  
                const proms: Promise<User>[] = [];
                for (const id of ids) {
                    proms.push(MockApiService.fetchUser(id));
                };
                return await Promise.all(proms);
            };

            const ids = [1, 2, 3];

            const sequentialResult = await fetchUsersSequentially(ids);
            const concurrentResult = await fetchUsersConcurrently(ids);

            expect(sequentialResult).toEqual(concurrentResult);
        });
    });

    // Problem 3: Error handling in concurrent operations
    describe('Problem 3: Error Handling with Promise.all and Promise.allSettled', () => {

        it('should_handle_partial_failures_with_promise_allsettled', async () => {
            // TODO: Implement fetching with graceful error handling
            // Requirements:
            // - Use Promise.allSettled to handle partial failures
            // - Return successful results and collect errors separately
            // - Type the return value properly

            interface FetchResult {
                successful: User[];
                errors: { id: number; error: string }[];
            }

            const fetchUsersWithErrorHandling = async (ids: number[]): Promise<FetchResult> => {
                // Your implementation here
                // Hint: Some IDs might be invalid (like -1, 0)
                const proms: Promise<User>[] = [];
                for (const id of ids) {
                    proms.push(MockApiService.fetchUser(id));
                };
                const settled = await Promise.allSettled(proms);

                const result: FetchResult = { successful: [], errors: [] };
                for (let i = 0; i < ids.length; i++) {
                    if (settled[i].status === "fulfilled")
                        result.successful.push((settled[i] as PromiseFulfilledResult<User>).value);
                    else
                        result.errors.push({ id: ids[i], error: (settled[i] as PromiseRejectedResult).reason });
                }
                return result;
            };

            const result = await fetchUsersWithErrorHandling([1, -1, 2, 0, 3]);

            expect(result.successful).toHaveLength(3); // IDs 1, 2, 3 should succeed
            expect(result.errors).toHaveLength(2);     // IDs -1, 0 should fail
        });

        it('should_understand_promise_all_fail_fast_behavior', async () => {
            // TODO: Demonstrate Promise.all fail-fast behavior
            // Requirements:
            // - Use Promise.all with mix of valid and invalid IDs
            // - Show that it throws on first error
            // - The function should throw, don't catch the error

            const fetchUsersFailFast = async (ids: number[]): Promise<User[]> => {
                // Your implementation here
                const proms: Promise<User>[] = [];
                for (const id of ids) {
                    proms.push(MockApiService.fetchUser(id));
                };
                return await Promise.all(proms);
            };

            // This should throw because of the invalid ID -1
            await expect(fetchUsersFailFast([1, -1, 2])).rejects.toThrow('Invalid user ID');
        });
    });

    // Problem 4: Timeout handling
    describe('Problem 4: Timeout and Cancellation', () => {

        it('should_implement_timeout_for_async_operations', async () => {
            // TODO: Implement a timeout wrapper for async operations
            // Requirements:
            // - Generic function that can wrap any Promise
            // - Throw TimeoutError if operation takes longer than specified timeout
            // - Preserve the original return type

            const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
                // Your implementation here
                const timeout = new Promise<never>(async () => {
                    await new Promise(resolve => setTimeout(resolve, timeoutMs));
                    throw new Error("Operation timed out");
                });

                try {
                    return await Promise.race([promise, timeout]);
                } catch (e) {
                    console.log(e);
                    throw e;
                }
            };

            // This should timeout since we're requesting a 1000ms delay with 100ms timeout
            const slowOperation = MockApiService.fetchUser(1, 1000);
            await expect(withTimeout(slowOperation, 100)).rejects.toThrow('Operation timed out');
        });

        it('should_handle_timeout_without_affecting_fast_operations', async () => {
            // TODO: Ensure fast operations complete normally with timeout wrapper

            const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
                // Your implementation here (reuse from previous test)
                const timeout = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(timeout);
                    }, timeoutMs);
                });

                return await Promise.any([promise, timeout]);
            };

            const fastOperation = MockApiService.fetchUser(1, 50);
            const result = await withTimeout(fastOperation, 200);

            expect(result.id).toBe(1);
        });
    });

    // Problem 5: Retry logic with exponential backoff
    describe('Problem 5: Retry Logic and Error Recovery', () => {

        it('should_implement_retry_with_exponential_backoff', async () => {
            // TODO: Implement retry logic with exponential backoff
            // Requirements:
            // - Retry failed operations up to maxRetries times
            // - Use exponential backoff: 100ms, 200ms, 400ms, etc.
            // - Only retry on NetworkError, not on other error types
            // - Preserve original function signature and return type

            interface RetryOptions {
                maxRetries: number;
                baseDelayMs: number;
            }

            const withRetry = async <T>(
                operation: () => Promise<T>,
                options: RetryOptions
            ): Promise<T> => {
                // Your implementation here
                let attempts = 0;
                do {
                    attempts++;

                    try {
                        return await operation();
                    } catch (e) {
                        MockApiService.delay(options.baseDelayMs * (2 ** (attempts - 1)))
                    }
                } while (attempts <= options.maxRetries);
                throw new Error('Service temporarily unavailable')
            };

            // This should eventually succeed after a few retries
            const result = await withRetry(
                () => MockApiService.unreliableOperation(0.3), // 30% success rate
                { maxRetries: 5, baseDelayMs: 10 }
            );

            expect(result).toBe('Success!');
        });

        it('should_give_up_after_max_retries_exceeded', async () => {
            // TODO: Ensure retry logic eventually gives up
            // Requirements:
            // - Should throw the last error after all retries are exhausted
            // - Don't retry forever

            interface RetryOptions {
                maxRetries: number;
                baseDelayMs: number;
            }

            const withRetry = async <T>(
                operation: () => Promise<T>,
                options: RetryOptions
            ): Promise<T> => {
                // Your implementation here (reuse from previous test)
                let attempts = 0;
                do {
                    attempts++;

                    try {
                        return await operation();
                    } catch (e) {
                        MockApiService.delay(options.baseDelayMs * (2 ** (attempts - 1)))
                    }
                } while (attempts <= options.maxRetries);
                throw new Error('Service temporarily unavailable')
            };

            await expect(
                withRetry(
                    () => MockApiService.unreliableOperation(0), // 0% success rate
                    { maxRetries: 2, baseDelayMs: 10 }
                )
            ).rejects.toThrow('Service temporarily unavailable');
        });
    });

    // Problem 6: Advanced patterns - async iterators and generators
    describe('Problem 6: Async Iterators and Generators', () => {

        it('should_implement_async_generator_for_paginated_data', async () => {
            // TODO: Implement an async generator for paginated API responses
            // Requirements:
            // - Yield users in batches (pages)
            // - Stop when no more data is available
            // - Handle the async nature of API calls

            async function* fetchUsersPaginated(
                pageSize: number
            ): AsyncGenerator<User[]> {
                // Your implementation here
                // Simulate pagination by fetching users with IDs starting from 1
                // Stop when you've fetched enough pages (e.g., 3 pages)
                let i = 1;
                while (true) {
                    const range = [...Array(pageSize).keys()].map(p => p + i);
                    yield await MockApiService.fetchUsers(range);
                    i += pageSize;
                }
            }

            const allUsers: User[] = [];
            for await (const userBatch of fetchUsersPaginated(2)) {
                allUsers.push(...userBatch);
                if (allUsers.length >= 6) break; // Prevent infinite loop in tests
            }

            expect(allUsers.length).toBeGreaterThanOrEqual(4);
        });

        it('should_consume_async_iterable_with_for_await', async () => {
            // TODO: Implement a function that consumes an async iterable
            // Requirements:
            // - Take an async iterable of User arrays
            // - Flatten all users into a single array
            // - Preserve the async nature

            const consumeAsyncUserBatches = async (
                asyncIterable: AsyncIterable<User[]>
            ): Promise<User[]> => {
                let result: User[] = [];
                for await (const batch of asyncIterable) {
                    result = result.concat(batch);
                }
                return result;
            };

            // Create a simple async iterable for testing
            async function* createTestIterable(): AsyncGenerator<User[], void, unknown> {
                yield [{ id: 1, name: 'User1', email: 'user1@example.com' }];
                yield [{ id: 2, name: 'User2', email: 'user2@example.com' }];
            }

            const result = await consumeAsyncUserBatches(createTestIterable());
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe(1);
            expect(result[1].id).toBe(2);
        });
    });

    // Problem 7: Race conditions and Promise.race
    describe('Problem 7: Race Conditions and Promise.race', () => {

        it('should_implement_fastest_response_wins_pattern', async () => {
            // TODO: Implement a function that races multiple API endpoints
            // Requirements:
            // - Call the same endpoint with different base URLs (simulate multiple servers)
            // - Return the result from whichever responds first
            // - Handle the case where all requests fail

            const fetchFromFastestEndpoint = async (...userIds: number[]): Promise<User> => {
                // Your implementation here
                // Simulate multiple endpoints with different delays
                const endpoints = userIds.map(
                    userId =>
                        MockApiService.fetchUser(userId, userId * 100)
                );
                return await Promise.race(endpoints);
            };

            const result = await fetchFromFastestEndpoint(2, 1, 3);
            expect(result.id).toBe(1);
        });

        it('should_handle_race_condition_with_timeout', async () => {
            // TODO: Combine Promise.race with timeout
            // Requirements:
            // - Race between the actual operation and a timeout
            // - Return result if operation completes first
            // - Throw TimeoutError if timeout wins

            const fetchWithRaceTimeout = async (userId: number, timeoutMs: number): Promise<User> => {
                // Your implementation here
                throw new Error('Not implemented');
            };

            // Fast operation should succeed
            const fastResult = await fetchWithRaceTimeout(1, 200);
            expect(fastResult.id).toBe(1);

            // Slow operation should timeout
            await expect(fetchWithRaceTimeout(1, 50)).rejects.toThrow('Operation timed out');
        });
    });

    // Problem 8: Type safety with async/await
    describe('Problem 8: Advanced TypeScript Async Patterns', () => {

        it('should_create_typed_async_pipeline', async () => {
            // TODO: Create a type-safe async pipeline
            // Requirements:
            // - Chain async operations with proper type inference
            // - Each step should transform the data type
            // - Maintain type safety throughout the pipeline

            type Pipeline<T, R> = (input: T) => Promise<R>;

            const createPipeline = <T, R>(
                ...operations: Pipeline<any, any>[]
            ): Pipeline<T, R> => {
                return async (input: T): Promise<R> => {
                    let ret = await operations[0](input);
                    for (let i = 1; i < operations.length; i++) {
                        ret = await operations[1](ret);
                    }
                    return ret;
                }
            };

            // Example pipeline: number -> User -> string
            const getUserEmail: Pipeline<number, string> = createPipeline(
                async (id: number) => await MockApiService.fetchUser(id),
                async (user: User) => user.email
            );

            const email = await getUserEmail(1);
            expect(email).toBe('user1@example.com');
        });

        it('should_implement_conditional_async_execution', async () => {
            // TODO: Implement conditional async execution with proper typing
            // Requirements:
            // - Execute different async operations based on a condition
            // - Maintain type safety for different return types
            // - Use discriminated unions or conditional types

            type AsyncResult<T extends 'user' | 'admin'> = T extends 'user'
                ? Promise<User>
                : Promise<User & { permissions: string[] }>;

            const fetchByRole = <T extends 'user' | 'admin'>(
                id: number,
                role: T
            ): AsyncResult<T> => {
                // Your implementation here
                throw new Error('Not implemented');
            };

            const user = await fetchByRole(1, 'user');
            const admin = await fetchByRole(1, 'admin');

            expect(user.id).toBe(1);
            expect(admin.id).toBe(1);
            expect('permissions' in admin).toBe(true);
        });
    });

});