import { body, param } from "express-validator";

export const createFormValidator = [
    body("title").notEmpty().withMessage("Title is required"),
    body("fields").isArray({ min: 0 }).withMessage("Fields must be an array"),
    body("fields.*.name").notEmpty().withMessage("Field name is required"),
    body("fields.*.componentType").notEmpty().withMessage("Field componentType is required"),
    body("fields.*.type").notEmpty().withMessage("Field type is required"),
];

export const updateFormValidator = [
    param("id").isInt().withMessage("Form id must be an integer"),
    body("title").optional().notEmpty().withMessage("Title cannot be empty"),
    body("fields").optional().isArray().withMessage("Fields must be an array"),
    body("fields.*.name").optional().notEmpty().withMessage("Field name is required"),
    body("fields.*.componentType").optional().notEmpty().withMessage("Field componentType is required"),
];

export const formIdValidator = [
    param("id").isInt().withMessage("Form id must be an integer"),
];

export const formSlugValidator = [
    param("slug").notEmpty().withMessage("Slug is required"),
];

export const submitResponseValidator = [
    param("id").isInt().withMessage("Form id must be an integer"),
    body("answers").isObject().withMessage("Answers must be an object"),
];
