@Library('SFE-RTC-pipeline') _

abortPreviousRunningBuilds()

notifyPRStatus("tests", new URL(env.BUILD_URL)) {
    node {
        checkout scm

        withNvm("v10.5.0", "npmrcFile") {
            stage("Install") {
                sh "npm install"
            }
            stage("Build") {
                sh "npm run build"
            }
            stage("Test") {
                sh "npm test"
            }
        }
    }
}
