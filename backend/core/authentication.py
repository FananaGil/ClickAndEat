"""
Custom authentication for CLICK&EAT project.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.contrib.auth import get_user_model

User = get_user_model()


class JWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that handles additional user attributes.
    """

    def get_user(self, validated_token):
        """
        Get user from validated token with additional checks.
        """
        try:
            user_id = validated_token.get('user_id')
            if user_id is None:
                raise InvalidToken('Token contained no recognizable user identification')

            user = User.objects.get(id=user_id)

            if not user.is_active:
                raise AuthenticationFailed('User is inactive')

            return user

        except User.DoesNotExist:
            raise InvalidToken('User not found')

        except Exception as e:
            raise InvalidToken(str(e))
