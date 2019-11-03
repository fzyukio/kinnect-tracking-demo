from mainapp.model_utils import get_or_error
from root.utils import data_path

__all__ = ['get_movement_data']


def read_skeleton_file(skeletaton_file):
    frames = []
    with open(skeletaton_file, 'r') as f:
        framecount = int(f.readline())
        for i in range(framecount):
            body_count = int(f.readline())
            bodies = []
            for j in range(body_count):
                body = dict()
                line = f.readline().strip()
                body_description = line.split(' ')

                body['bodyId'] = int(body_description[0])
                body['clipedEdges'] = int(body_description[1])
                body['handLeftConfidence'] = int(body_description[2])
                body['handLeftState'] = int(body_description[3])
                body['handRightConfidence'] = int(body_description[4])
                body['handRightState'] = int(body_description[5])
                body['isResticted'] = int(body_description[6])
                body['leanX'] = float(body_description[7])
                body['leanY'] = float(body_description[8])
                body['trackingState'] = float(body_description[9])
                body['jointCount'] = int(f.readline())

                joints = []

                for k in range(body['jointCount']):
                    line = f.readline().strip()
                    joint_info = line.split(' ')
                    joint = dict()

                    joint['x'] = float(joint_info[0])
                    joint['y'] = float(joint_info[1])
                    joint['z'] = float(joint_info[2])
                    joint['depthX'] = float(joint_info[3])
                    joint['depthY'] = float(joint_info[4])
                    joint['colorX'] = float(joint_info[5])
                    joint['colorY'] = float(joint_info[6])
                    joint['orientationW'] = float(joint_info[7])
                    joint['orientationX'] = float(joint_info[8])
                    joint['orientationY'] = float(joint_info[9])
                    joint['orientationZ'] = float(joint_info[10])
                    joint['trackingState'] = int(joint_info[11])

                    joints.append(joint)
                body['joints'] = joints
                bodies.append(body)
            frames.append(bodies)
    return frames


def get_movement_data(request):
    """
    Return a playable audio segment given the segment id
    :param request: must specify segment-id, this is the ID of a Segment object to be played
    :return: a binary blob specified as audio/ogg (or whatever the format is), playable and volume set to -10dB
    """
    movement_id = get_or_error(request.POST, 'movement-id')
    skeletaton_file = data_path('movements', '{}.skeleton'.format(movement_id), for_url=False)

    # skeletaton_file = 'user_data/movements/S017C003P020R002A060.skeleton'
    frames = read_skeleton_file(skeletaton_file)
    num_frames = len(frames)
    rgb_files = []
    for i in range(1, num_frames + 1):
        rgb_file = data_path('movements', '{}_rgb/{}_rgb-{:04d}.jpg'.format(movement_id, movement_id, i),
                             for_url=True)
        rgb_files.append(rgb_file)

    return dict(frames=frames, imgs=rgb_files)
