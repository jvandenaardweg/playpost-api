import { Request, Response } from 'express';
import { BillingService } from '../../services/billingService';
import { BaseController } from '../index';

export class BillingController extends BaseController {
  billingService: BillingService;

  constructor() {
    super()
    this.billingService = new BillingService();
  }

  getIndex = async (req: Request, res: Response): Promise<Response> => {
    return res.status(200).send('OK');
  };

  getAllPlans = async (req: Request, res: Response): Promise<Response> => {
    // const userId = req.user.id;

    try {
      // const requestQuery = this.validatePagingParams(req.query);
      // const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
      const response = await this.billingService.findAllPlans();

      return res.json(response);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  getOnePlan = async (req: Request, res: Response): Promise<Response> => {
    const { stripePlanId } = req.params;

    try {
      const response = await this.billingService.findOnePlan(stripePlanId);

      return res.json(response);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  getAllProducts = async (req: Request, res: Response): Promise<Response> => {
    // const userId = req.user.id;

    try {
      // const requestQuery = this.validatePagingParams(req.query);
      // const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
      const response = await this.billingService.findAllProductsWithPlans();

      return res.json(response);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  getOneProduct = async (req: Request, res: Response): Promise<Response> => {
    const { stripeProductId } = req.params;

    try {
      const response = await this.billingService.findOneProduct(stripeProductId);

      return res.json(response);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  getAllTaxRates = async (req: Request, res: Response): Promise<Response> => {
    // const userId = req.user.id;

    try {
      // const requestQuery = this.validatePagingParams(req.query);
      // const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
      const response = await this.billingService.findAllTaxRates();

      return res.json(response);
    } catch (err) {
      return this.handleError(err, res);
    }
  };

  getOneTaxRate = async (req: Request, res: Response): Promise<Response> => {
    const { stripeTaxRateId } = req.params;

    try {
      const response = await this.billingService.findOneTaxRate(stripeTaxRateId);

      return res.json(response);
    } catch (err) {
      return this.handleError(err, res);
    }
  };
}
