import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Moment from 'App/Models/Moment'
import Application from '@ioc:Adonis/Core/Application'
import { v4 as uuid } from 'uuid'

export default class MomentsController {
  private validationOptions = {
    types: ['image'],
    size: '2mb',
  }

  public async store({ request, response }: HttpContextContract) {
    const body = request.body()
    const image = request.file('image', this.validationOptions)
    let imageName
    if (image) {
      imageName = `${uuid()}.${image.extname}`
      await image.move(Application.tmpPath('uploads'), {
        name: imageName,
      })
    }
    const newMoment = {
      image: imageName,
      ...body,
    }

    const { id, ...moment } = (await Moment.create(newMoment))['$attributes']
    response.status(201)
    return {
      msg: 'Moment created successfully',
      data: moment,
    }
  }

  public async index() {
    const moments = await Moment.all()
    const momentsWithoutId = moments.map(({ $attributes: { id, ...moment } }) => moment)
    return {
      data: momentsWithoutId,
    }
  }

  public async show({ params }: HttpContextContract) {
    const { id, ...moment } = (await Moment.findOrFail(params.id))['$attributes']
    return {
      data: moment,
    }
  }

  public async destroy({ params }: HttpContextContract) {
    const moment = await Moment.findOrFail(params.id)
    await moment.delete()
    const { id, ...deletedMoment } = moment['$attributes']
    return {
      message: 'Moment deleted successfully',
      data: deletedMoment,
    }
  }

  public async update({ params, request }: HttpContextContract) {
    const body = request.body()
    const moment = await Moment.findOrFail(params.id)
    const image = request.file('image', this.validationOptions)

    if (image && (moment.image !== body.image || !moment.image)) {
      moment.merge(body)
      moment.image = `${uuid()}.${image.extname}`
      await image.move(Application.tmpPath('uploads'), {
        name: moment.image,
      })
    } else {
      moment.merge(body)
    }

    await moment.save()
    const { id, ...updatedMoment } = moment['$attributes']
    return {
      message: 'Moment updated successfully',
      data: updatedMoment,
    }
  }
}
