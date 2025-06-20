import UserModel from '@/model/User';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/dbConnects';
import { User } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function DELETE(
    request: Request,
    { params }: { params: { messageid: string } }
) {
    const messageId = params.messageid;

    await dbConnect();

    const session = await getServerSession(authOptions);
    const _user: User = session?.user;
    if (!session || !_user) {
        return Response.json(
            {
                success: false,
                message: 'Not authenticated'
            },
            { status: 401 }
        );
    }

    try {
        const updateResult = await UserModel.updateOne(
            { _id: _user._id },
            { $pull: { messages: { _id: messageId } } }
        );

        if (updateResult.modifiedCount === 0) {
            return Response.json(
                {
                    success: false,
                    message: 'Message not found or already deleted'
                },
                { status: 404 }
            );
        }

        return Response.json(
            {
                success: true,
                message: 'Message deleted'
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting message:', error);
        return Response.json(
            {
                success: false,
                message: 'Error deleting message'
            },
            { status: 500 }
        );
    }
}