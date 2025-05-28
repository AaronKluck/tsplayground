import { Request, Response, NextFunction } from 'express';
import * as db from '../db/userDb';


const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
        fn(req, res, next).catch(next);
    };


export const getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
        success: true,
        data: await db.getAllUsers(),
        message: 'Users retrieved successfully'
    });
});

export const createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { username, email, password_hash } = req.body;

    // Basic validation
    if (!username || !email || !password_hash) {
        res.status(400).json({
            message: 'username, email, password_hash are required'
        });
        return;
    }

    try {
        const user = await db.createUser({ username, email, password_hash });
        res.status(201).json(user);
    } catch (error) {
        if (error instanceof db.UserAlreadyExistsError) {
            res.status(409).json({
                message: 'User already exists'
            });
        } else {
            res.status(500).json({
                message: 'Internal server error'
            });
        }
    }
});

export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id);
        const user = await db.getUserById(userId);
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof db.UserNotFoundError) {
            res.status(404).json({
                message: error.message
            });
        } else {
            res.status(500).json({
                message: 'Internal server error'
            });
        }
    }
});

export const deleteUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id);
        const user = await db.deleteUser(userId);
        res.status(200).json(user);
    } catch (error) {
        if (error instanceof db.UserNotFoundError) {
            res.status(404).json({
                message: error.message
            });
        } else {
            res.status(500).json({
                message: 'Internal server error'
            });
        }
    }
});
