import { CheckoutEntity } from '@app/checkout/core/domain/entities/checkout.entity';
import { ICheckoutRepository } from '@app/checkout/core/domain/interfaces/repositories/checkout.repository.interface';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CheckoutRepository implements ICheckoutRepository {
  constructor(
    @InjectRepository(CheckoutEntity)
    private readonly checkoutRepository: Repository<CheckoutEntity>,
  ) {}

  async getAll(): Promise<CheckoutEntity[]> {
    return this.checkoutRepository.find();
  }

  async getById(id: number): Promise<CheckoutEntity> {
    return this.checkoutRepository.findOne({
      where: { id },
      relations: ['order'],
    });
  }

  async create(checkoutEntity: CheckoutEntity): Promise<CheckoutEntity> {
    return this.checkoutRepository.save(checkoutEntity);
  }

  async update(
    id: number,
    payload: Partial<CheckoutEntity>,
  ): Promise<CheckoutEntity> {
    await this.checkoutRepository.update(id, payload);
    return this.getById(id);
  }

  async getByOrderId(orderId: number): Promise<CheckoutEntity> {
    return this.checkoutRepository.findOne({
      where: { orderId },
      relations: ['order'],
    });
  }
}
