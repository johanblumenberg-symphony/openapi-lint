@Library('SFE-RTC-pipeline') _

node {
    def tagParam = params.VERSION_TAG ? "--tag ${params.VERSION_TAG}" : ""

    checkout scm

    withNvm("v10.5.0", "npmrcFile") {
        stage("Install") {
            sh "npm install"
        }
        stage("Step version") {
            sh "npm run step-version set -- ${tagParam}"
        }
        stage("Build") {
            sh "npm run build"
        }
        stage("Unit Test") {
            sh "npm test"
        }

        stage("Publish Packages") {
            if (sh(returnStatus: true, script: "npm run step-version list-changed -- --query")) {
                sh "npm run step-version tag"

                sh "npm run env | grep registry"
                sh "npm publish"

                withGitCredentials("githubaccess") {
                    sh "git push --tags"
                }
            }
        }
    }
}
