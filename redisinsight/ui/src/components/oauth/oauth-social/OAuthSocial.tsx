import React, { useState } from 'react'
import { EuiButtonIcon, EuiCheckbox, EuiIcon, EuiText, EuiTitle, EuiToolTip } from '@elastic/eui'
import cx from 'classnames'
import { useDispatch, useSelector } from 'react-redux'

import { ipcAuthGithub, ipcAuthGoogle } from 'uiSrc/electron/utils'
import { TelemetryEvent, sendEventTelemetry } from 'uiSrc/telemetry'
import { setOAuthCloudSource, signIn, oauthCloudPAgreementSelector } from 'uiSrc/slices/oauth/cloud'
import { FeatureFlagComponent, OAuthAgreement } from 'uiSrc/components'
import { setIsRecommendedSettingsSSO, setSSOFlow } from 'uiSrc/slices/instances/cloud'
import { OAuthSocialSource } from 'uiSrc/slices/interfaces'
import { FeatureFlags } from 'uiSrc/constants'
import { appFeatureFlagsFeaturesSelector } from 'uiSrc/slices/app/features'

import { ReactComponent as GoogleIcon } from 'uiSrc/assets/img/oauth/google.svg'
import { ReactComponent as GithubIcon } from 'uiSrc/assets/img/oauth/github.svg'
import { ReactComponent as GoogleSmallIcon } from 'uiSrc/assets/img/oauth/google_small.svg'
import { ReactComponent as GithubSmallIcon } from 'uiSrc/assets/img/oauth/github_small.svg'

import styles from './styles.module.scss'

// TODO: move business logic outside of component
export enum OAuthSocialType {
  Create = 'create',
  Autodiscovery = 'autodiscovery',
  SignIn = 'signIn'
}

interface Props {
  type?: OAuthSocialType
  hideTitle?: boolean
}

const OAuthSocial = ({ type = OAuthSocialType.SignIn, hideTitle = false }: Props) => {
  const agreement = useSelector(oauthCloudPAgreementSelector)
  const {
    [FeatureFlags.cloudSsoRecommendedSettings]: isRecommendedFeatureEnabled
  } = useSelector(appFeatureFlagsFeaturesSelector)
  const [isRecommended, setIsRecommended] = useState(isRecommendedFeatureEnabled?.flag ? true : undefined)

  const dispatch = useDispatch()
  const isAutodiscovery = type === OAuthSocialType.Autodiscovery
  const isSignInFlow = type === OAuthSocialType.SignIn
  const getAction = () => (isSignInFlow ? 'signIn' : (isAutodiscovery ? 'import' : 'create'))

  const sendTelemetry = (accountOption: string) => {
    const cloudRecommendedSettings = isAutodiscovery
      ? undefined
      : (!isRecommendedFeatureEnabled?.flag
        ? 'not displayed'
        : (isRecommended ? 'enabled' : 'disabled'))

    return sendEventTelemetry({
      event: TelemetryEvent.CLOUD_SIGN_IN_SOCIAL_ACCOUNT_SELECTED,
      eventData: {
        accountOption,
        action: getAction(),
        cloudRecommendedSettings
      },
      traits: {
        cloudRecommendedSettings
      }
    })
  }

  const handleClickSso = () => {
    dispatch(signIn())
    dispatch(setSSOFlow(getAction()))

    if (isSignInFlow) return

    isAutodiscovery && dispatch(setOAuthCloudSource(OAuthSocialSource.Autodiscovery))
    if (!isAutodiscovery) {
      dispatch(setIsRecommendedSettingsSSO(isRecommended))
    }
  }

  const socialLinks = [
    {
      className: styles.googleButton,
      icon: isAutodiscovery ? GoogleSmallIcon : GoogleIcon,
      label: 'google-oauth',
      onButtonClick: () => {
        sendTelemetry('Google')
        ipcAuthGoogle(getAction())
      },
    },
    {
      icon: isAutodiscovery ? GithubSmallIcon : GithubIcon,
      label: 'github-oauth',
      className: styles.githubButton,
      onButtonClick: () => {
        sendTelemetry('GitHub')
        ipcAuthGithub(getAction())
      },
    }
  ]

  const buttons = socialLinks.map(({ icon, label, className = '', onButtonClick }) => (
    <EuiToolTip
      key={label}
      position="top"
      anchorClassName={!agreement ? 'euiToolTip__btn-disabled' : ''}
      content={agreement ? null : 'Acknowledge the agreement'}
      data-testid={`${label}-tooltip`}
    >
      <EuiButtonIcon
        iconType={icon}
        disabled={!agreement}
        className={cx(styles.button, className)}
        onClick={() => {
          handleClickSso()
          onButtonClick()
        }}
        data-testid={label}
        aria-labelledby={label}
      />
    </EuiToolTip>
  ))

  const RecommendedSettingsCheckBox = () => (
    <FeatureFlagComponent name={FeatureFlags.cloudSsoRecommendedSettings}>
      <div className={styles.recommendedSettings}>
        <EuiCheckbox
          id="ouath-recommended-settings"
          name="recommended-settings"
          label="Use recommended settings"
          checked={isRecommended}
          onChange={(e) => setIsRecommended(e.target.checked)}
          data-testid="oauth-recommended-settings-checkbox"
        />
        <EuiToolTip
          content={(
            <>
              The database will be automatically created using a pre-selected provider and region.
              <br />
              You can change it by signing in to Redis Cloud.
            </>
          )}
          position="top"
          anchorClassName={styles.recommendedSettingsToolTip}
        >
          <EuiIcon type="iInCircle" size="s" />
        </EuiToolTip>
      </div>
    </FeatureFlagComponent>
  )

  if (type === OAuthSocialType.Create) {
    return (
      <div className={cx(styles.container)}>
        {buttons}
        <div className={styles.containerAgreement}>
          <RecommendedSettingsCheckBox />
          <OAuthAgreement />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cx(styles.container, { [styles.containerAuto]: isAutodiscovery })}
      data-testid={`oauth-container-${type}`}
    >
      {!hideTitle && (<EuiTitle className={styles.title}><h4>Sign in to your Cloud Account</h4></EuiTitle>)}
      {isAutodiscovery && (
        <EuiText className={styles.text} color="subdued">
          Auto-discover subscriptions and add your databases.
          <br />
          A new Redis Cloud account will be created for you if you don’t have one.
        </EuiText>
      )}
      <div className={cx({ [styles.buttonsAuto]: isAutodiscovery })}>
        {buttons}
      </div>
      <div className={styles.containerAgreement}>
        <OAuthAgreement />
      </div>
    </div>
  )
}

export default OAuthSocial
