import { PlatformsModel } from '../models';
import { platformsConstants } from '../constants';

export class JiraServices {
  static async saveJiraToken({ data }: any) {
    try {
      const platform = new PlatformsModel(data);

      await platform.save();
      return { success: true };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async getJiraToken({ connectorId }: any) {
    try {
      const platform = await PlatformsModel.findOne({
        connectorId,
        type: platformsConstants.PLATFORMS.jira.value,
      });
      return { success: true, data: platform };
    } catch (err) {
      return { success: false, err };
    }
  }

  static async updateJiraToken({ connectorId, data }: any) {
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
