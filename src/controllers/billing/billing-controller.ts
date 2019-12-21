import { Request, Response } from 'express';
import { BillingService } from '../../services/billing-service';
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
    // const userId = req.user!.id;

    // const requestQuery = this.validatePagingParams(req.query);
    // const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const response = await this.billingService.findAllPlans();

    return res.json(response);
  };

  getOnePlan = async (req: Request, res: Response): Promise<Response> => {
    const { stripePlanId } = req.params;

    const response = await this.billingService.findOnePlan(stripePlanId);

    return res.json(response);
  };

  getAllProducts = async (req: Request, res: Response): Promise<Response> => {
    // const userId = req.user!.id;

    // const requestQuery = this.validatePagingParams(req.query);
    // const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const response = await this.billingService.findAllProductsWithPlans();

    return res.json(response);
  };

  getOneProduct = async (req: Request, res: Response): Promise<Response> => {
    const { stripeProductId } = req.params;

    const response = await this.billingService.findOneProduct(stripeProductId);

    return res.json(response);
  };

  getAllTaxRates = async (req: Request, res: Response): Promise<Response> => {
    // const userId = req.user!.id;

    // const requestQuery = this.validatePagingParams(req.query);
    // const { page, perPage, skip, take } = this.getPagingParams(requestQuery);
    const response = await this.billingService.findAllTaxRates();

    return res.json(response);
  };

  getOneTaxRate = async (req: Request, res: Response): Promise<Response> => {
    const { stripeTaxRateId } = req.params;

    const response = await this.billingService.findOneTaxRate(stripeTaxRateId);

    return res.json(response);
  };
}
