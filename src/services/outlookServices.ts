import { PlatformsModel } from '../models';
import { platformsConstants } from '../constants';

export default class OutlookServices {
  static async saveOutlookToken({ data }: any) {
    try {
      const platform = new PlatformsModel(data);

      await platform.save();
      return { success: true };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async getOutlookToken({ connectorId }: any) {
    try {
      const platform = await PlatformsModel.findOne({
        connectorId,
        type: platformsConstants.PLATFORMS.outlook.value,
      });
      return { success: true, data: platform };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async updateOutlookToken({ connectorId, data }: any) {
    try {
      const platform = await PlatformsModel.findOneAndUpdate(
        { connectorId },
        data,
        { new: true }
      );
      return { success: true, data: platform };
    } catch (err) {
      return { success: false, err };
    }
  }
}
